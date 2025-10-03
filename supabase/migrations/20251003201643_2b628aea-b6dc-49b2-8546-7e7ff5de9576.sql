-- Update handle_new_user trigger to generate unique_id, display_name
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
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
$$;

-- Update existing profiles to add unique_id where missing
UPDATE public.profiles 
SET unique_id = upper(substr(md5(random()::text || id::text), 1, 8))
WHERE unique_id IS NULL;