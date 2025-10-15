import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret for scheduled cron jobs
    const webhookSecret = req.headers.get('X-Webhook-Secret');
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
    
    if (!expectedSecret) {
      console.error("WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (webhookSecret !== expectedSecret) {
      console.error("Invalid webhook secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending reminders that are due
    const { data: reminders, error } = await supabase
      .from("reminders")
      .select(`
        id,
        user_id,
        type,
        message,
        profiles!reminders_user_id_fkey (
          id,
          display_name,
          username
        )
      `)
      .eq("sent", false)
      .lte("scheduled_at", new Date().toISOString())
      .limit(50);

    if (error) throw error;

    console.log(`Found ${reminders?.length || 0} reminders to send`);

    // Send reminders
    const results = await Promise.allSettled(
      (reminders || []).map(async (reminder) => {
        // Create notification in database
        await supabase.from("notifications").insert({
          user_id: reminder.user_id,
          type: "reminder",
          title: reminder.type === "daily" ? "Ежедневное напоминание" : 
                 reminder.type === "weekly" ? "Еженедельная сводка" : 
                 "Ежемесячный отчёт",
          message: reminder.message,
          link: "/calendar",
        });

        // Mark reminder as sent
        await supabase
          .from("reminders")
          .update({ sent: true })
          .eq("id", reminder.id);

        return { success: true, id: reminder.id };
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Reminders sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful,
        failed: failed,
        message: `Sent ${successful} reminders` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});