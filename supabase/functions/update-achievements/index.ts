import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { user_id } = await req.json();
    console.log("Updating achievements for user:", user_id);

    // Get user profile
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("quit_date, cigarettes_per_day")
      .eq("id", user_id)
      .single();

    if (!profile || !profile.quit_date) {
      return new Response(JSON.stringify({ message: "Profile not found or quit_date not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get daily logs
    const { data: logs } = await supabaseClient
      .from("daily_logs")
      .select("*")
      .eq("user_id", user_id)
      .order("date", { ascending: false });

    // Get all achievements
    const { data: achievements } = await supabaseClient
      .from("achievements")
      .select("*");

    if (!achievements) {
      return new Response(JSON.stringify({ message: "No achievements found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has any achievement records, if not - initialize them
    const { data: existingUserAchievements } = await supabaseClient
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user_id);

    if (!existingUserAchievements || existingUserAchievements.length === 0) {
      console.log("Initializing achievements for new user");
      for (const achievement of achievements) {
        await supabaseClient.from("user_achievements").insert({
          user_id,
          achievement_id: achievement.id,
          progress: 0,
          earned_at: null,
        });
      }
    }

    if (!logs || logs.length === 0) {
      console.log("No logs found for user");
      return new Response(JSON.stringify({ message: "No logs yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate statistics
    const quitDate = new Date(profile.quit_date);
    const today = new Date();
    const daysSinceQuit = Math.floor((today.getTime() - quitDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Count consecutive days with 0 cigarettes (starting from most recent)
    let smokeFreeStreak = 0;
    for (let i = 0; i < logs.length; i++) {
      if (logs[i].cigarettes_smoked === 0) {
        smokeFreeStreak++;
      } else {
        break; // Stop at first day with smoking
      }
    }

    const totalLogs = logs.length;
    const totalSmoked = logs.reduce((sum, log) => sum + log.cigarettes_smoked, 0);
    const totalSmokeFreedays = logs.filter(log => log.cigarettes_smoked === 0).length;

    // Update or create user achievements
    for (const achievement of achievements) {
      let progress = 0;
      let earned = false;

      switch (achievement.type) {
        case "days_smoke_free":
          // Consecutive days with 0 cigarettes
          progress = smokeFreeStreak;
          earned = progress >= achievement.requirement;
          break;
        case "days":
          // Total days with 0 cigarettes (not necessarily consecutive)
          progress = totalSmokeFreedays;
          earned = progress >= achievement.requirement;
          break;
        case "days_since_quit":
          progress = daysSinceQuit;
          earned = progress >= achievement.requirement;
          break;
        case "total_logs":
          progress = totalLogs;
          earned = progress >= achievement.requirement;
          break;
        case "reduction":
          const avgSmoked = totalLogs > 0 ? totalSmoked / totalLogs : profile.cigarettes_per_day;
          progress = Math.max(0, profile.cigarettes_per_day - avgSmoked);
          earned = progress >= achievement.requirement;
          break;
        case "money":
          // Calculate money saved based on cigarettes avoided
          const targetCigs = daysSinceQuit * profile.cigarettes_per_day;
          const savedCigs = Math.max(0, targetCigs - totalSmoked);
          progress = Math.round(savedCigs * 4500 / 20); // Approximate pack price in KRW
          earned = progress >= achievement.requirement;
          break;
      }

      // Upsert user achievement
      await supabaseClient.from("user_achievements").upsert({
        user_id,
        achievement_id: achievement.id,
        progress: Math.floor(progress),
        earned_at: earned ? new Date().toISOString() : null,
      }, {
        onConflict: "user_id,achievement_id"
      });
    }

    console.log("Achievements updated successfully");
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating achievements:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
