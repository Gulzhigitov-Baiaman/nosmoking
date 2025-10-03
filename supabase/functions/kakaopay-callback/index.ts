import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[KAKAOPAY-CALLBACK] ${step}${detailsStr}`);
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
    logStep("Callback received");

    const url = new URL(req.url);
    const pgToken = url.searchParams.get("pg_token");
    const tid = url.searchParams.get("tid");

    if (!pgToken || !tid) {
      throw new Error("Missing pg_token or tid");
    }

    logStep("Parameters received", { tid });

    // Find subscription by tid
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("kakaopay_tid", tid)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found");
    }

    logStep("Subscription found", { subscriptionId: subscription.id });

    // Call KakaoPay Approve API
    const kakaoResponse = await fetch("https://open-api.kakaopay.com/online/v1/payment/approve", {
      method: "POST",
      headers: {
        "Authorization": `SECRET_KEY ${Deno.env.get("KAKAOPAY_REST_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cid: "TC0ONETIME",
        tid: tid,
        partner_order_id: subscription.kakaopay_order_id,
        partner_user_id: subscription.user_id,
        pg_token: pgToken,
      }),
    });

    if (!kakaoResponse.ok) {
      const errorData = await kakaoResponse.text();
      logStep("KakaoPay Approve Error", { error: errorData });
      throw new Error(`KakaoPay approve failed: ${errorData}`);
    }

    const approveData = await kakaoResponse.json();
    logStep("Payment approved", { amount: approveData.amount.total });

    // Update subscription status
    const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({
        status: "trialing",
        trial_ends_at: trialEndsAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      logStep("Error updating subscription", { error: updateError });
      throw new Error("Failed to update subscription");
    }

    // Create payment record
    const { error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        amount: approveData.amount.total,
        currency: "KRW",
        status: "completed",
        payment_method: "kakaopay",
        transaction_id: tid,
        metadata: approveData,
      });

    if (paymentError) {
      logStep("Error creating payment record", { error: paymentError });
    }

    logStep("Payment completed successfully");

    // Send confirmation email
    try {
      await supabaseClient.functions.invoke("send-subscription-confirmation", {
        body: {
          email: subscription.user_id,
          language: "ko",
          amount: approveData.amount.total,
        },
      });
    } catch (emailError) {
      logStep("Email sending failed", { error: emailError });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
