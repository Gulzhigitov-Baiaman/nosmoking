import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId } = await req.json();
    if (!priceId) throw new Error("priceId is required");
    logStep("Price ID received", { priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Validate that the price is recurring
    const price = await stripe.prices.retrieve(priceId);
    if (price.type !== 'recurring') {
      throw new Error(`Price ${priceId} is not recurring. Cannot create subscription.`);
    }
    logStep("Price validated as recurring", { 
      priceId, 
      interval: price.recurring?.interval,
      intervalCount: price.recurring?.interval_count 
    });

    // Find or create customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });

      // Check for existing subscription to prevent duplicates
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        logStep("Active subscription already exists", { subscriptionId: subscriptions.data[0].id });
        return new Response(JSON.stringify({ 
          error: "You already have an active subscription. Please manage it from your account." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Check for recent unpaid checkout sessions
      const recentSessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 3,
      });

      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const recentUnpaid = recentSessions.data.find((s: Stripe.Checkout.Session) => {
        const createdAt = s.created * 1000;
        return createdAt > tenMinutesAgo && s.payment_status === 'unpaid';
      });

      if (recentUnpaid) {
        logStep("Returning existing unpaid session", { sessionId: recentUnpaid.id });
        return new Response(JSON.stringify({ url: recentUnpaid.url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      const customer = await stripe.customers.create({ 
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    const origin = req.headers.get("origin") || "https://xzcrzqyhubrsndopnzxj.supabase.co";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id, // For webhook processing
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: "subscription",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium?checkout=canceled`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
