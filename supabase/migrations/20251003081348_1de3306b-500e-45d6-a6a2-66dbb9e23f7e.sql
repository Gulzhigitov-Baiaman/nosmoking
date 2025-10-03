-- Add KakaoPay fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'kakaopay',
ADD COLUMN IF NOT EXISTS kakaopay_tid text,
ADD COLUMN IF NOT EXISTS kakaopay_order_id text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_kakaopay_tid 
ON subscriptions(kakaopay_tid);

-- Add preferred language to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'ko';

-- Update existing profiles to have Korean as default
UPDATE profiles SET preferred_language = 'ko' WHERE preferred_language IS NULL;