-- Fix search_path for trigger_update_achievements function
CREATE OR REPLACE FUNCTION public.trigger_update_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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