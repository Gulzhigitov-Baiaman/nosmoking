import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[KAKAOPAY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId } = await req.json();
    const amount = priceId === "price_premium" ? 9990 : 9990;

    // Generate unique order ID
    const partnerOrderId = `ORDER_${user.id}_${Date.now()}`;
    const partnerUserId = user.id;

    logStep("Preparing KakaoPay payment", { amount, partnerOrderId });

    // Call KakaoPay Ready API
    const kakaoResponse = await fetch("https://open-api.kakaopay.com/online/v1/payment/ready", {
      method: "POST",
      headers: {
        "Authorization": `SECRET_KEY ${Deno.env.get("KAKAOPAY_REST_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cid: "TC0ONETIME",
        partner_order_id: partnerOrderId,
        partner_user_id: partnerUserId,
        item_name: "Premium Subscription - 1 Month",
        quantity: 1,
        total_amount: amount,
        tax_free_amount: 0,
        approval_url: `${req.headers.get("origin")}/dashboard?payment=success`,
        cancel_url: `${req.headers.get("origin")}/premium?payment=canceled`,
        fail_url: `${req.headers.get("origin")}/premium?payment=failed`,
      }),
    });

    if (!kakaoResponse.ok) {
      const errorData = await kakaoResponse.text();
      logStep("KakaoPay API Error", { status: kakaoResponse.status, error: errorData });
      throw new Error(`KakaoPay API error: ${errorData}`);
    }

    const kakaoData = await kakaoResponse.json();
    logStep("KakaoPay Ready success", { tid: kakaoData.tid });

    // Create pending subscription
    const { error: subError } = await supabaseClient
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_id: "00000000-0000-0000-0000-000000000000",
        status: "pending",
        payment_provider: "kakaopay",
        kakaopay_tid: kakaoData.tid,
        kakaopay_order_id: partnerOrderId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (subError) {
      logStep("Error creating subscription", { error: subError });
      throw new Error(`Failed to create subscription: ${subError.message}`);
    }

    logStep("Subscription created successfully");

    return new Response(JSON.stringify({ 
      redirect_url: kakaoData.next_redirect_pc_url,
      mobile_url: kakaoData.next_redirect_mobile_url,
      tid: kakaoData.tid
    }), {
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
