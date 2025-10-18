-- Add CHECK constraints to prevent negative values in cigarette tracking

-- Prevent negative cigarette counts in daily logs
ALTER TABLE daily_logs 
ADD CONSTRAINT cigarettes_smoked_positive 
CHECK (cigarettes_smoked >= 0);

-- Prevent negative values in smoking plans
ALTER TABLE smoking_plans 
ADD CONSTRAINT start_cigarettes_positive CHECK (start_cigarettes >= 0),
ADD CONSTRAINT target_cigarettes_positive CHECK (target_cigarettes >= 0),
ADD CONSTRAINT reduction_positive CHECK (reduction_per_week >= 0),
ADD CONSTRAINT daily_limit_positive CHECK (daily_limit IS NULL OR daily_limit >= 0);

-- Prevent negative values in user profiles
ALTER TABLE profiles
ADD CONSTRAINT cigarettes_per_day_positive CHECK (cigarettes_per_day >= 0),
ADD CONSTRAINT pack_price_positive CHECK (pack_price >= 0),
ADD CONSTRAINT minutes_positive CHECK (minutes_per_cigarette > 0);