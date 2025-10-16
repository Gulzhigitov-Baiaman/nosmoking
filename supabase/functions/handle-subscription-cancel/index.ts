import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found");
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });

      if (trialingSubscriptions.data.length > 0) {
        const subscription = trialingSubscriptions.data[0];
        logStep("Canceling trialing subscription", { subscriptionId: subscription.id });
        
        // Cancel subscription
        await stripe.subscriptions.cancel(subscription.id);
        
        // Issue refund for trial period if payment was made
        const paymentIntents = await stripe.paymentIntents.list({
          customer: customerId,
          limit: 5,
        });
        
        const recentPayment = paymentIntents.data.find((pi: any) => 
          pi.status === 'succeeded' && 
          pi.created * 1000 > Date.now() - (3 * 24 * 60 * 60 * 1000)
        );

        if (recentPayment) {
          logStep("Issuing refund", { paymentIntentId: recentPayment.id });
          await stripe.refunds.create({
            payment_intent: recentPayment.id,
            reason: 'requested_by_customer',
          });

          // Send refund email
          await supabaseClient.functions.invoke("send-refund-email", {
            body: {
              email: user.email,
              amount: recentPayment.amount,
              currency: recentPayment.currency,
            },
          });
        }

        // Update DB
        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ 
          success: true,
          refunded: !!recentPayment,
          message: recentPayment 
            ? "Подписка отменена. Средства будут возвращены в течение 3–5 рабочих дней."
            : "Подписка отменена."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      throw new Error("No active subscription found");
    }

    const subscription = subscriptions.data[0];
    logStep("Canceling active subscription", { subscriptionId: subscription.id });
    
    await stripe.subscriptions.cancel(subscription.id);

    await supabaseClient
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      refunded: false,
      message: "Подписка отменена. Доступ сохранится до конца оплаченного периода."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
