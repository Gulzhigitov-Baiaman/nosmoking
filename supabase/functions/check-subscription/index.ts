import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const maskEmail = (email: string): string => {
  const [user, domain] = email.split('@');
  return `${user.substring(0, 2)}***@${domain}`;
};

const logStep = (step: string, details?: any) => {
  // Mask sensitive data in logs
  let sanitizedDetails = details;
  if (details && typeof details === 'object') {
    sanitizedDetails = JSON.parse(JSON.stringify(details));
    if (sanitizedDetails.email) {
      sanitizedDetails.email = maskEmail(sanitizedDetails.email);
    }
    // Remove payment amounts and customer IDs
    if (sanitizedDetails.customerId) {
      sanitizedDetails.customerId = sanitizedDetails.customerId.substring(0, 8) + '***';
    }
  }
  const detailsStr = sanitizedDetails ? ` - ${JSON.stringify(sanitizedDetails)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // FIRST: Check local database for subscription (most reliable, reflects webhook data)
    logStep("Checking local database for subscription");
    const { data: dbSub, error: dbError } = await supabaseClient
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .gt('current_period_end', new Date().toISOString())
      .maybeSingle();

    if (dbError) {
      logStep("Database query error", { error: dbError.message });
    }

    if (dbSub) {
      // Found active subscription in database
      logStep("Active subscription found in database", {
        subscriptionId: dbSub.id,
        status: dbSub.status,
        currentPeriodEnd: dbSub.current_period_end,
        trialEndsAt: dbSub.trial_ends_at
      });

      return new Response(JSON.stringify({
        subscribed: true,
        plan_name: "Premium",
        subscription_end: dbSub.current_period_end
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // SECOND: If not in DB, check Stripe (for cases where webhook hasn't fired yet)
    logStep("No active subscription in DB, checking Stripe");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Fetch ALL subscriptions and filter for active OR trialing
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });
    
    logStep("Stripe subscriptions retrieved", { 
      count: subscriptions.data.length,
      subscriptions: subscriptions.data.map((sub: any) => ({
        id: sub.id,
        status: sub.status,
        created: new Date(sub.created * 1000).toISOString(),
      }))
    });
    
    // Filter for subscriptions that are either active or trialing
    const activeSubscriptions = subscriptions.data.filter(
      (sub: any) => sub.status === 'active' || sub.status === 'trialing'
    );
    
    const hasActiveSub = activeSubscriptions.length > 0;
    let planName = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = activeSubscriptions[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found in Stripe", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        endDate: subscriptionEnd,
        isTrialing: subscription.status === 'trialing'
      });
      
      planName = "Premium";

      // AUTO-SYNC: Create subscription in database
      logStep("Auto-syncing Stripe subscription to database");
      const planId = 'c27dbaea-7a36-4f09-bb9d-2563cdcfc079'; // Premium plan UUID
      
      const { error: syncError } = await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: planId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          payment_provider: 'stripe',
        }, {
          onConflict: 'user_id',
        });

      if (syncError) {
        logStep("Auto-sync failed", { error: syncError.message });
      } else {
        logStep("✅ Subscription synced to database successfully");
      }
    } else {
      logStep("No active or trialing subscription found in Stripe");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_name: planName,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    return new Response(JSON.stringify({ error: "Unable to check subscription status. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
