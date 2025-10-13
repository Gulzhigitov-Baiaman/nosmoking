-- Drop trigger and function with CASCADE
DROP TRIGGER IF EXISTS update_achievements_on_log ON daily_logs CASCADE;
DROP TRIGGER IF EXISTS on_daily_log_change ON daily_logs CASCADE;
DROP FUNCTION IF EXISTS public.trigger_update_achievements() CASCADE;

-- Create new trigger function with correct schema (pg_net instead of net)
CREATE OR REPLACE FUNCTION public.trigger_update_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM pg_net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/update-achievements',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := jsonb_build_object('user_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_achievements_on_log
AFTER INSERT OR UPDATE ON daily_logs
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_achievements();