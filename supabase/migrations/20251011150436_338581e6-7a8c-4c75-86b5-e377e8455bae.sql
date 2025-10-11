-- Create trigger function for updating achievements
CREATE OR REPLACE FUNCTION public.trigger_update_achievements()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on daily_logs
CREATE TRIGGER update_achievements_on_log
AFTER INSERT OR UPDATE ON public.daily_logs
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_achievements();

-- Update achievement types for clarity
UPDATE public.achievements 
SET type = 'days_smoke_free' 
WHERE type = 'days_since_quit' AND name IN ('Первый день', 'Неделя без дыма', 'Месяц свободы', 'Год силы');

UPDATE public.achievements 
SET type = 'money' 
WHERE name = 'Первая экономия';