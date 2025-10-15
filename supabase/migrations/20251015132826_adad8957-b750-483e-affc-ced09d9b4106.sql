-- Fix 1: Update has_active_subscription function to use empty search_path
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE subscriptions.user_id = has_active_subscription.user_id
      AND status IN ('trialing', 'active')
      AND current_period_end > now()
  );
$function$;

-- Fix 2: Update notify_friend_request trigger function with empty search_path
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Fix 3: Update handle_new_user trigger function with empty search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
begin
  insert into public.profiles (id, username, display_name, unique_id, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(substr(md5(random()::text || new.id::text), 1, 8)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$function$;

-- Fix 4: Add leaderboard INSERT and UPDATE policies
CREATE POLICY "Users can add own leaderboard entry"
ON public.leaderboard
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.challenge_participants 
    WHERE user_id = auth.uid() AND challenge_id = leaderboard.challenge_id
  )
);

CREATE POLICY "Users can update own score"
ON public.leaderboard
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 5: Create secure profile update function with column restrictions
CREATE OR REPLACE FUNCTION public.update_safe_profile_fields(
  _display_name text DEFAULT NULL,
  _bio text DEFAULT NULL,
  _avatar_url text DEFAULT NULL,
  _quit_date timestamptz DEFAULT NULL,
  _cigarettes_per_day integer DEFAULT NULL,
  _pack_price numeric DEFAULT NULL,
  _minutes_per_cigarette integer DEFAULT NULL,
  _preferred_language text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET
    display_name = COALESCE(_display_name, display_name),
    bio = COALESCE(_bio, bio),
    avatar_url = COALESCE(_avatar_url, avatar_url),
    quit_date = COALESCE(_quit_date, quit_date),
    cigarettes_per_day = COALESCE(_cigarettes_per_day, cigarettes_per_day),
    pack_price = COALESCE(_pack_price, pack_price),
    minutes_per_cigarette = COALESCE(_minutes_per_cigarette, minutes_per_cigarette),
    preferred_language = COALESCE(_preferred_language, preferred_language),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Fix 6: Create function to set featured achievements with validation
CREATE OR REPLACE FUNCTION public.set_featured_achievements(_achievement_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate user actually earned these achievements
  IF _achievement_ids IS NOT NULL AND array_length(_achievement_ids, 1) > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_achievements
      WHERE user_id = auth.uid()
        AND achievement_id = ANY(_achievement_ids)
        AND earned_at IS NOT NULL
      HAVING COUNT(*) = array_length(_achievement_ids, 1)
    ) THEN
      RAISE EXCEPTION 'Can only feature earned achievements';
    END IF;
  END IF;
  
  UPDATE public.profiles
  SET featured_achievements = _achievement_ids
  WHERE id = auth.uid();
END;
$$;

-- Fix 7: Replace unrestricted profile update policy with restricted one
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update via safe function only"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Ensure protected fields haven't changed
  unique_id = (SELECT unique_id FROM public.profiles WHERE id = auth.uid()) AND
  featured_achievements = (SELECT featured_achievements FROM public.profiles WHERE id = auth.uid())
);

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.update_safe_profile_fields TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_featured_achievements TO authenticated;