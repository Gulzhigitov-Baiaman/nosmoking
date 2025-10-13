-- Add new fields to smoking_plans for Quit Plan functionality
ALTER TABLE smoking_plans
ADD COLUMN IF NOT EXISTS quit_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS daily_limit INTEGER,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'gradual';

COMMENT ON COLUMN smoking_plans.quit_date IS 'Target date for complete cessation';
COMMENT ON COLUMN smoking_plans.daily_limit IS 'Current daily limit of cigarettes/puffs';
COMMENT ON COLUMN smoking_plans.plan_type IS 'Type of plan: gradual or cold_turkey';