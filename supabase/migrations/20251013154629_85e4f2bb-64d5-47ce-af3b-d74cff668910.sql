-- Деактивировать старые планы без quit_date
UPDATE smoking_plans
SET is_active = false
WHERE quit_date IS NULL;

-- Удалить триггер pg_net (вызывает ошибку)
DROP TRIGGER IF EXISTS update_achievements_on_log ON daily_logs;
DROP FUNCTION IF EXISTS public.trigger_update_achievements() CASCADE;