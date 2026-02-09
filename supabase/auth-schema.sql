-- Creator Campaign Pro – Auth schema (Supabase Auth + profiles + RLS)
-- Run in Supabase SQL Editor after supabase/schema.sql (tables campaigns, notifications, notification_settings must exist).

-- =============================================================================
-- Helper: current user email (for RLS policies)
-- =============================================================================
create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from auth.users where id = auth.uid();
$$;

-- =============================================================================
-- Profiles (one row per auth user)
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    now(),
    now()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- =============================================================================
-- RLS: notifications (restrict by current user email)
-- =============================================================================
drop policy if exists "Allow all on notifications" on public.notifications;
create policy "Users can manage own notifications" on public.notifications
  for all
  using (user_email = public.current_user_email())
  with check (user_email = public.current_user_email());

-- =============================================================================
-- RLS: notification_settings (restrict by current user email)
-- =============================================================================
drop policy if exists "Allow all on notification_settings" on public.notification_settings;
create policy "Users can manage own notification_settings" on public.notification_settings
  for all
  using (user_email = public.current_user_email())
  with check (user_email = public.current_user_email());

-- campaigns: keep existing "Allow all" policy (no change).
