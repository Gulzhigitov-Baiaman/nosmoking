import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    console.log("Creating recurring price for Premium Subscription...");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create recurring price
    const price = await stripe.prices.create({
      product: "prod_TEgJMwjXG7spnX", // Existing Premium Subscription product
      unit_amount: 9990, // ₩9,990
      currency: "krw",
      recurring: {
        interval: "month",
      },
      nickname: "Premium Monthly Subscription",
    });

    console.log("✅ Recurring price created successfully:", price.id);

    return new Response(JSON.stringify({ 
      success: true,
      price_id: price.id,
      message: "Recurring price created successfully! Use this ID in your code.",
      details: {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error creating price:", errorMessage);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});