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

const toISODate = (timestamp: number | null | undefined): string | null => {
  if (!timestamp || isNaN(timestamp)) return null;
  try {
    return new Date(timestamp * 1000).toISOString();
  } catch (error) {
    console.error('Error converting timestamp:', timestamp, error);
    return null;
  }
};

serve(async (req) => {
  // VERY FIRST LOG - to confirm function is invoked
  console.log("[ACTIVATE-SUBSCRIPTION] === FUNCTION INVOKED ===");
  
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
    let subscription: Stripe.Subscription | null = null;
    let subscriptionId: string | null = null;
    
    // Try to get subscription from session
    if (session.subscription) {
      subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription?.id;
      
      logStep("Extracting subscription ID from session", { subscriptionId, type: typeof session.subscription });
      
      try {
        subscription = await stripe.subscriptions.retrieve(subscriptionId);
        logStep("Subscription retrieved from Stripe", { 
          subscriptionId: subscription.id,
          status: subscription.status,
          trialEnd: subscription.trial_end,
          currentPeriodEnd: subscription.current_period_end
        });
      } catch (subError) {
        logStep("Could not retrieve subscription from Stripe", { error: subError });
        subscription = null;
      }
    }
    
    // If we have a subscription object, validate its status
    if (subscription) {
      const validStatuses = ['active', 'trialing'];
      const isCanceledDuringTrial = subscription.status === 'canceled' && 
                                    subscription.trial_end && 
                                    subscription.trial_end * 1000 > Date.now();
      
      if (!validStatuses.includes(subscription.status) && !isCanceledDuringTrial) {
        logStep("WARNING: Subscription status not active/trialing", { status: subscription.status });
        // Don't throw - we'll still create a record for paid sessions
      }
    }
    
    // Determine what to store in database
    let planId = 'premium'; // Default
    let status = 'active';
    let trialEnd: number | null = null;
    let periodStart: number = Math.floor(Date.now() / 1000);
    let periodEnd: number = periodStart + (30 * 24 * 60 * 60); // 30 days
    
    if (subscription) {
      // Use real subscription data if available
      planId = subscription.items.data[0]?.price.product as string || planId;
      status = subscription.status;
      trialEnd = subscription.trial_end;
      periodStart = subscription.current_period_start;
      periodEnd = subscription.current_period_end;
    } else if (session.payment_status === 'paid') {
      // Payment succeeded but no subscription - create manually
      logStep("No subscription found but payment succeeded - creating manual subscription");
      status = 'active';
      // Set period to 30 days from now
      periodEnd = periodStart + (30 * 24 * 60 * 60);
    } else {
      throw new Error("No subscription found and payment not completed");
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
        newStatus: status 
      });
      
      // Update existing subscription
      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          status: status,
          current_period_start: toISODate(periodStart),
          current_period_end: toISODate(periodEnd),
          trial_ends_at: toISODate(trialEnd),
          payment_provider: 'stripe',
          updated_at: toISODate(Math.floor(Date.now() / 1000)),
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
          plan_id: planId,
          status: status,
          current_period_start: toISODate(periodStart),
          current_period_end: toISODate(periodEnd),
          trial_ends_at: toISODate(trialEnd),
          payment_provider: 'stripe',
        });

      if (insertError) {
        logStep("Error inserting subscription", { error: insertError.message });
        throw insertError;
      }

      logStep("Subscription created in database");
    }

    // Record payment if paid (not during trial)
    if (session.payment_status === 'paid' && session.payment_intent) {
      // Get actual subscription price - from subscription if available, else from session
      let subscriptionPrice = 999000; // Default 9990 KRW in cents
      let currency = 'krw';
      let priceId = null;
      
      if (subscription?.items?.data?.[0]?.price) {
        subscriptionPrice = subscription.items.data[0].price.unit_amount || subscriptionPrice;
        currency = subscription.items.data[0].price.currency || currency;
        priceId = subscription.items.data[0].price.id;
      } else if (session.amount_total) {
        subscriptionPrice = session.amount_total;
        currency = session.currency || currency;
      }
      
      logStep("Recording payment", { 
        amount: subscriptionPrice / 100,
        currency: currency.toUpperCase(),
        payment_intent: session.payment_intent
      });

      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          user_id: user.id,
          amount: subscriptionPrice / 100, // Actual subscription price
          currency: currency.toUpperCase(),
          status: 'completed',
          payment_method: 'stripe',
          transaction_id: session.payment_intent as string, // Use payment_intent, not session.id
          metadata: {
            subscription_id: subscription?.id || subscriptionId,
            session_id: session.id,
            price_id: priceId,
          }
        });

      if (paymentError) {
        logStep("Error recording payment", { error: paymentError.message });
        // Don't throw - subscription is still valid
      } else {
        logStep("Payment recorded successfully");
      }
    } else {
      logStep("No payment to record - trial period or unpaid", {
        payment_status: session.payment_status,
        has_payment_intent: !!session.payment_intent
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      subscribed: true,
      status: status,
      trial_end: toISODate(trialEnd),
      current_period_end: toISODate(periodEnd),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Detailed error logging
    console.error("[ACTIVATE-SUBSCRIPTION] === CRITICAL ERROR ===");
    console.error("Error message:", errorMessage);
    console.error("Error stack:", errorStack);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    logStep("ERROR in activate-subscription", { 
      message: errorMessage, 
      stack: errorStack,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      details: errorStack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
