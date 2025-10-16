import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ACTIVATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("sessionId is required");
    logStep("Session ID received", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });
    logStep("Session retrieved", { 
      sessionId: session.id,
      paymentStatus: session.payment_status,
      mode: session.mode,
      subscriptionId: session.subscription 
    });

    // Verify the session belongs to this user
    const customer = session.customer as Stripe.Customer;
    if (customer.email !== user.email) {
      throw new Error("Session does not belong to authenticated user");
    }

    // Check if payment is complete or subscription is trialing
    if (session.mode !== 'subscription') {
      throw new Error("Session is not for a subscription");
    }

    if (!session.subscription) {
      throw new Error("No subscription found in session");
    }

    // Retrieve full subscription details
    // Safely extract subscription ID (can be string or object)
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription?.id;
    
    if (!subscriptionId) {
      throw new Error("No subscription ID found in session");
    }
    
    logStep("Extracting subscription ID", { subscriptionId, type: typeof session.subscription });
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    logStep("Subscription retrieved", { 
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEnd: subscription.trial_end,
      currentPeriodEnd: subscription.current_period_end
    });

    // Check if subscription is active or trialing
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      throw new Error(`Subscription status is ${subscription.status}, not active or trialing`);
    }

    // Check if subscription already exists in database
    const { data: existingSub } = await supabaseClient
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existingSub) {
      logStep("Subscription already exists in database", { 
        existingStatus: existingSub.status,
        newStatus: subscription.status 
      });
      
      // Update existing subscription
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          payment_provider: 'stripe',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        logStep("Error updating subscription", { error: updateError.message });
        throw updateError;
      }
      
      logStep("Subscription updated successfully");
    } else {
      // Create new subscription record
      const { error: insertError } = await supabaseClient
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: subscription.items.data[0].price.product as string,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          payment_provider: 'stripe',
        });

      if (insertError) {
        logStep("Error inserting subscription", { error: insertError.message });
        throw insertError;
      }

      logStep("Subscription created in database");
    }

    // Record payment if not a trial
    if (session.payment_status === 'paid' && session.amount_total) {
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          user_id: user.id,
          amount: session.amount_total / 100,
          currency: session.currency?.toUpperCase() || 'KRW',
          status: 'completed',
          payment_method: 'stripe',
          transaction_id: session.payment_intent as string || session.id,
          metadata: {
            subscription_id: subscription.id,
            session_id: session.id,
          }
        });

      if (paymentError) {
        logStep("Error recording payment", { error: paymentError.message });
        // Don't throw - subscription is still valid
      } else {
        logStep("Payment recorded successfully");
      }
    } else {
      logStep("No payment to record - trial period or unpaid");
    }

    return new Response(JSON.stringify({ 
      success: true,
      subscribed: true,
      status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in activate-subscription", { 
      message: errorMessage, 
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
