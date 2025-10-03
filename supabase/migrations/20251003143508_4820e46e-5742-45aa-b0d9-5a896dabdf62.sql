-- ФАЗА 1: Обновление таблицы profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unique_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Генерация уникальных ID для существующих пользователей
UPDATE public.profiles 
SET unique_id = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE unique_id IS NULL;

-- Копирование username в display_name для существующих пользователей
UPDATE public.profiles 
SET display_name = username
WHERE display_name IS NULL;

-- Индекс для быстрого поиска по unique_id
CREATE INDEX IF NOT EXISTS idx_profiles_unique_id ON public.profiles(unique_id);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- ФАЗА 2: Storage bucket для аватаров
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS политики для avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ФАЗА 3: Обновление таблицы friends
ALTER TABLE public.friends 
ADD COLUMN IF NOT EXISTS request_message TEXT,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Обновить существующие записи
UPDATE public.friends 
SET requested_at = created_at
WHERE requested_at IS NULL;

-- ФАЗА 4: Таблица для личных сообщений
CREATE TABLE IF NOT EXISTS public.private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON public.private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON public.private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON public.private_messages(created_at DESC);

ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
ON public.private_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.private_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status of received messages"
ON public.private_messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Включить realtime для личных сообщений
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;

-- ФАЗА 5: Таблица уведомлений
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'achievement', 'challenge', 'system', 'message')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Включить realtime для уведомлений
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ФАЗА 6: Таблица достижений
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('days', 'money', 'cigarettes', 'challenges', 'exercises')),
  requirement INTEGER NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

-- ФАЗА 7: Таблица достижений пользователей
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
ON public.user_achievements FOR UPDATE
USING (auth.uid() = user_id);

-- ФАЗА 8: Таблица упражнений
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL,
  animation_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL CHECK (category IN ('breathing', 'physical', 'meditation')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercises"
ON public.exercises FOR SELECT
USING (true);

-- ФАЗА 9: Таблица лайфхаков
CREATE TABLE IF NOT EXISTS public.lifehacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('stress', 'habit', 'money', 'trigger', 'breathing', 'activity')),
  is_premium BOOLEAN DEFAULT FALSE,
  user_submitted BOOLEAN DEFAULT FALSE,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifehacks_category ON public.lifehacks(category);

ALTER TABLE public.lifehacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lifehacks"
ON public.lifehacks FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can submit lifehacks"
ON public.lifehacks FOR INSERT
WITH CHECK (auth.uid() = submitted_by AND user_submitted = true);

-- ФАЗА 10: Обновление таблицы challenges
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reward TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('smoke_free', 'money', 'fitness', 'combined'));

-- ФАЗА 11: Таблица прогресса челленджей
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON public.challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge ON public.challenge_progress(challenge_id);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
ON public.challenge_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.challenge_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.challenge_progress FOR UPDATE
USING (auth.uid() = user_id);

-- ФАЗА 12: Таблица лидерборда
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_challenge ON public.leaderboard(challenge_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(challenge_id, score DESC);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
ON public.leaderboard FOR SELECT
USING (true);

-- ФАЗА 13: Таблица реакций на сообщения в общем чате
CREATE TABLE IF NOT EXISTS public.chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON public.chat_reactions(message_id);

ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
ON public.chat_reactions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add reactions"
ON public.chat_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
ON public.chat_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Включить realtime для реакций
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;

-- ФАЗА 14: Конвертация валюты в воны (умножаем на 15)
UPDATE public.profiles 
SET pack_price = pack_price * 15
WHERE pack_price IS NOT NULL AND pack_price > 0;

UPDATE public.subscription_plans 
SET price = price * 15
WHERE price IS NOT NULL AND price > 0;

-- ФАЗА 15: Триггер для уведомлений при запросе в друзья
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.friend_id,
      'friend_request',
      'Новый запрос в друзья',
      (SELECT display_name FROM public.profiles WHERE id = NEW.user_id) || ' хочет добавить вас в друзья',
      '/friends'
    );
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'friend_accepted',
      'Запрос принят',
      (SELECT display_name FROM public.profiles WHERE id = NEW.friend_id) || ' принял(а) ваш запрос в друзья',
      '/friends'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_change ON public.friends;
CREATE TRIGGER on_friend_request_change
  AFTER INSERT OR UPDATE ON public.friends
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request();

-- ФАЗА 16: Вставка начальных достижений
INSERT INTO public.achievements (name, description, icon, type, requirement, is_premium, rarity) VALUES
('Первый шаг', 'Провели 1 день без сигарет', '🎯', 'days', 1, false, 'common'),
('Неделя силы', 'Провели 7 дней без сигарет', '🔥', 'days', 7, false, 'rare'),
('Месяц победы', 'Провели 30 дней без сигарет', '💪', 'days', 30, false, 'epic'),
('Легенда', 'Провели 100 дней без сигарет', '🏆', 'days', 100, true, 'legendary'),
('Первая экономия', 'Сэкономили 10,000₩', '💰', 'money', 10000, false, 'common'),
('Финансист', 'Сэкономили 100,000₩', '💎', 'money', 100000, false, 'rare'),
('Миллионер', 'Сэкономили 1,000,000₩', '👑', 'money', 1000000, true, 'legendary'),
('Чемпион челленджей', 'Завершили 5 челленджей', '⭐', 'challenges', 5, false, 'epic'),
('Король челленджей', 'Завершили 10 челленджей', '🌟', 'challenges', 10, true, 'legendary')
ON CONFLICT DO NOTHING;

-- ФАЗА 17: Вставка лайфхаков
INSERT INTO public.lifehacks (title, description, category, is_premium) VALUES
('Метод зубочистки', 'Когда тянется рука к сигарете — возьмите зубочистку или карандаш в рот. Это снижает привычку держать что-то во рту.', 'habit', false),
('Пейте больше воды', 'Вода помогает выводить никотин из организма и заменяет ощущение «что-то положить в рот».', 'trigger', false),
('Короткая физактивность', 'Захотелось покурить → сделайте 10 приседаний или 10 отжиманий. Мысли переключаются.', 'activity', false),
('Метод жвачки', 'Никотиновая жвачка или даже обычная семечка помогает занять рот.', 'habit', false),
('Замените кофе', 'Многие курят именно с кофе. Если поменять напиток (лимонная вода, травяной чай) — привычный триггер ослабевает.', 'trigger', false),
('Дыхательное упражнение 4-7-8', 'Вдох 4 секунды, задержка 7 секунд, выдох 8 секунд. Повторить 4 раза. Снижает желание на 70%.', 'breathing', false),
('Письмо самому себе', 'Напишите: «Зачем я хочу бросить?». Когда тяжело — перечитайте это письмо.', 'stress', true),
('Карта триггеров', 'Отмечайте моменты, когда чаще тянется к сигарете (кофе, после работы). Подготовьте альтернативы.', 'trigger', true),
('Принцип «Пачка = Награда»', 'Если сегодня не купили пачку — потратьте эти деньги на себя (сладость, кино, игру).', 'money', false),
('Список альтернатив', 'Создайте список из 10 действий при желании закурить: вода, прогулка, звонок другу, упражнение.', 'habit', true)
ON CONFLICT DO NOTHING;

-- ФАЗА 18: Вставка упражнений
INSERT INTO public.exercises (name, description, duration, is_premium, category) VALUES
('Глубокое дыхание', 'Медленно вдыхайте через нос 4 секунды, задержите дыхание на 4 секунды, выдыхайте через рот 6 секунд.', 60, false, 'breathing'),
('Дыхание 4-7-8', 'Вдох через нос 4 сек, задержка 7 сек, выдох через рот 8 сек. Повторить 4 раза.', 90, false, 'breathing'),
('Приседания', 'Встаньте прямо, ноги на ширине плеч. Приседайте до параллели с полом, затем возвращайтесь.', 30, false, 'physical'),
('Отжимания', 'Примите упор лёжа, опускайте тело до касания грудью пола, затем возвращайтесь.', 30, false, 'physical'),
('Прыжки на месте', 'Прыгайте на месте в течение 30 секунд, активно двигая руками.', 30, false, 'physical'),
('Медитация осознанности', 'Сядьте удобно, закройте глаза. Сосредоточьтесь на дыхании. Наблюдайте за мыслями без оценки.', 300, true, 'meditation'),
('Визуализация', 'Представьте себя через год здоровым, энергичным, без зависимости. Почувствуйте радость.', 180, true, 'meditation'),
('Боксёрская стойка', 'Станьте в боксёрскую стойку, делайте быстрые удары руками в воздух 30 секунд.', 30, true, 'physical'),
('Планка', 'Примите положение планки на локтях. Держите тело прямым 30-60 секунд.', 60, true, 'physical'),
('Йога-растяжка', 'Комплекс простых йога-асан для расслабления и снятия напряжения.', 600, true, 'meditation')
ON CONFLICT DO NOTHING;

-- ФАЗА 19: Обновление челленджей
UPDATE public.challenges 
SET 
  is_premium = false,
  difficulty = 'easy',
  category = 'smoke_free',
  reward = '🎯 Достижение "Неделя силы"'
WHERE name LIKE '%7%' OR name LIKE '%week%' OR name LIKE '%неделя%' OR name LIKE '%일주일%';

UPDATE public.challenges 
SET 
  is_premium = true,
  difficulty = 'hard',
  category = 'smoke_free',
  reward = '🏆 Достижение "Легенда" + 50,000₩ в копилку'
WHERE name LIKE '%21%' OR name LIKE '%month%' OR name LIKE '%месяц%' OR name LIKE '%개월%';