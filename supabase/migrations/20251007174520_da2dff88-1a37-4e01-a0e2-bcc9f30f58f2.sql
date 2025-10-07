-- Add featured_achievements to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS featured_achievements UUID[] DEFAULT '{}';

-- Add end_date to smoking_plans table
ALTER TABLE public.smoking_plans 
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Create trigger for updating achievements after daily_logs changes
CREATE OR REPLACE FUNCTION public.trigger_update_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
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

-- Create trigger on daily_logs
DROP TRIGGER IF EXISTS on_daily_log_change ON public.daily_logs;
CREATE TRIGGER on_daily_log_change
  AFTER INSERT OR UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_achievements();