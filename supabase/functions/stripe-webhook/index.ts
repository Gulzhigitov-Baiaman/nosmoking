import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
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
    // Remove payment amounts, only keep transaction IDs
    if (sanitizedDetails.amount) delete sanitizedDetails.amount;
    if (sanitizedDetails.customerId) {
      sanitizedDetails.customerId = sanitizedDetails.customerId.substring(0, 8) + '***';
    }
  }
  const detailsStr = sanitizedDetails ? ` - ${JSON.stringify(sanitizedDetails)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) throw new Error("No stripe-signature header");

    const body = await req.text();
    let event: Stripe.Event;

    try {
      // Use async verification in Deno/Web Crypto environments
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Event verified", { type: event.type, id: event.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: "Webhook signature verification failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { 
          sessionId: session.id, 
          mode: session.mode,
          customerId: session.customer,
          subscriptionId: session.subscription,
          email: session.customer_details?.email
        });

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          // Find user by customer email - much more reliable
          let userId: string | null = null;
          
          if (session.customer_details?.email) {
            logStep("Finding user by email", { email: session.customer_details.email });
            
            // Get all users and find by email
            const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers();
            
            if (usersError) {
              logStep("Error listing users", { error: usersError.message });
            } else {
              const user = users.find(u => u.email === session.customer_details?.email);
              if (user) {
                userId = user.id;
                logStep("User found", { userId, email: user.email });
              } else {
                logStep("No user found with email", { email: session.customer_details.email });
              }
            }
          }

          if (!userId) {
            logStep("No user ID found for subscription - cannot create record");
            break;
          }

          // Get plan_id (Premium plan)
          const planId = 'c27dbaea-7a36-4f09-bb9d-2563cdcfc079'; // Premium plan UUID
          
          // Store subscription in database with UPSERT
          // Ensure timestamps are valid before inserting
          const periodStart = subscription.current_period_start 
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : new Date().toISOString();
          const periodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days if missing
          
          const { error: dbError } = await supabaseClient
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan_id: planId,
              status: subscription.status,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              payment_provider: 'stripe',
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });

          if (dbError) {
            logStep("Database error", { error: dbError.message, code: dbError.code });
          } else {
            logStep("✅ Subscription stored in database", { userId, subscriptionId: subscription.id, status: subscription.status });
          }

          // Store payment record if payment was made
          if (session.payment_status === 'paid' && session.payment_intent) {
            const { error: paymentError } = await supabaseClient
              .from('payments')
              .insert({
                user_id: userId,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency?.toUpperCase() || 'KRW',
                status: 'completed',
                payment_method: 'stripe',
                transaction_id: session.payment_intent as string,
                metadata: {
                  subscription_id: subscription.id,
                  session_id: session.id,
                }
              });

            if (paymentError) {
              logStep("Payment record error", { error: paymentError.message });
            } else {
              logStep("✅ Payment recorded", { amount: session.amount_total });
            }
          }

          // Send welcome email
          if (session.customer_details?.email) {
            try {
              const emailResult = await supabaseClient.functions.invoke('send-premium-email', {
                body: {
                  email: session.customer_details.email,
                  subscriptionId: subscription.id,
                  trialEnd: toISODate(subscription.trial_end) || toISODate(subscription.current_period_end),
                }
              });
              
              if (emailResult.error) {
                logStep("Email send failed", { error: emailResult.error });
              } else {
                logStep("✅ Welcome email sent", { email: session.customer_details.email });
              }
            } catch (emailError) {
              logStep("Email send exception", { error: emailError instanceof Error ? emailError.message : String(emailError) });
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        logStep("Subscription updated", { 
          subscriptionId: subscription.id, 
          status: subscription.status,
          userId 
        });

        if (userId) {
          const { error } = await supabaseClient
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (error) {
            logStep("Update error", { error: error.message });
          } else {
            logStep("Subscription updated in database", { userId });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        logStep("Subscription deleted", { subscriptionId: subscription.id, userId, status: subscription.status });

        if (userId) {
          // Check if subscription was canceled during trial or within 72 hours
          const wasTrialing = subscription.status === 'trialing';
          
          if (!wasTrialing) {
            // Check for recent payment to refund
            try {
              const paymentIntents = await stripe.paymentIntents.list({
                customer: subscription.customer as string,
                limit: 1,
              });
              
              if (paymentIntents.data.length > 0) {
                const lastPayment = paymentIntents.data[0];
                const paymentDate = new Date(lastPayment.created * 1000);
                const now = new Date();
                const hoursSincePayment = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60);
                
                if (hoursSincePayment <= 72 && lastPayment.status === 'succeeded') {
                  // Create refund
                  const refund = await stripe.refunds.create({
                    payment_intent: lastPayment.id,
                    reason: 'requested_by_customer',
                  });
                  
                  logStep("Automatic refund created", { 
                    userId, 
                    paymentIntentId: lastPayment.id,
                    amount: lastPayment.amount,
                    refundId: refund.id
                  });
                  
                  // Get customer email
                  const customer = await stripe.customers.retrieve(subscription.customer as string);
                  const customerEmail = (customer as Stripe.Customer).email;
                  
                  // Send refund email
                  if (customerEmail) {
                    await supabaseClient.functions.invoke('send-refund-email', {
                      body: {
                        email: customerEmail,
                        amount: lastPayment.amount / 100,
                        currency: lastPayment.currency,
                      }
                    });
                    logStep("Refund email sent", { email: customerEmail });
                  }
                }
              }
            } catch (refundError) {
              logStep("Refund error", { error: refundError instanceof Error ? refundError.message : String(refundError) });
            }
          } else {
            logStep("Trial canceled - no charge was made", { userId });
          }

          // Update subscription status in database - only update status and timestamps
          const { error } = await supabaseClient
            .from('subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (error) {
            logStep("Cancellation error", { error: error.message });
          } else {
            logStep("Subscription canceled in database", { userId });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment succeeded", { 
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          amount: invoice.amount_paid 
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", { 
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription 
        });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
