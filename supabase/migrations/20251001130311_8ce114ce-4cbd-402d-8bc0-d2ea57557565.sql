-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  quit_date timestamptz,
  cigarettes_per_day integer default 0,
  pack_price decimal(10,2) default 0,
  minutes_per_cigarette integer default 5,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create smoking_plans table
create table public.smoking_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  start_cigarettes integer not null,
  target_cigarettes integer default 0,
  reduction_per_week integer not null,
  start_date timestamptz default now(),
  end_date timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.smoking_plans enable row level security;

create policy "Users can view own plans"
  on public.smoking_plans for select
  using (auth.uid() = user_id);

create policy "Users can create own plans"
  on public.smoking_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on public.smoking_plans for update
  using (auth.uid() = user_id);

-- Create daily_logs table
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  date date not null,
  cigarettes_smoked integer default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.daily_logs enable row level security;

create policy "Users can view own logs"
  on public.daily_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on public.daily_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own logs"
  on public.daily_logs for update
  using (auth.uid() = user_id);

-- Create chat_messages table
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  message text not null,
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;

create policy "Anyone can view messages"
  on public.chat_messages for select
  using (true);

create policy "Authenticated users can create messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

-- Enable realtime for chat
alter publication supabase_realtime add table public.chat_messages;

-- Create challenges table
create table public.challenges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  created_by uuid references public.profiles on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.challenges enable row level security;

create policy "Anyone can view challenges"
  on public.challenges for select
  using (true);

create policy "Authenticated users can create challenges"
  on public.challenges for insert
  with check (auth.uid() = created_by);

-- Create challenge_participants table
create table public.challenge_participants (
  id uuid default gen_random_uuid() primary key,
  challenge_id uuid references public.challenges on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  joined_at timestamptz default now(),
  unique(challenge_id, user_id)
);

alter table public.challenge_participants enable row level security;

create policy "Anyone can view participants"
  on public.challenge_participants for select
  using (true);

create policy "Users can join challenges"
  on public.challenge_participants for insert
  with check (auth.uid() = user_id);

-- Create friends table
create table public.friends (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  friend_id uuid references public.profiles on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

alter table public.friends enable row level security;

create policy "Users can view own friendships"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can create friend requests"
  on public.friends for insert
  with check (auth.uid() = user_id);

create policy "Users can update friend requests"
  on public.friends for update
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Create function to handle new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();