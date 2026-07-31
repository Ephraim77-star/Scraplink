-- migrations/create_profiles.sql
-- Create profiles table and auth trigger for ScrapLink
-- This migration creates a profiles table keyed by auth.users.id and
-- installs a trigger to insert a profile row when a new auth user is created.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Per-user settings table (stores small JSON preferences per user)
create table if not exists public.user_settings (
  id uuid primary key references auth.users on delete cascade,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Function to insert a profile row when an auth user is created
create or replace function public.handle_new_user() returns trigger as $$
begin
  -- Ensure a profile row exists for the new user
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do nothing;
  

  -- Create default settings row for the user
  insert into public.user_settings (id, preferences, created_at)
  values (new.id, '{}'::jsonb, now())
  on conflict (id) do nothing;

  -- Create a simple welcome post for the new user.
  -- This insert runs as the function's security definer so it bypasses
  -- client-side RLS restrictions. Adjust the image_url to a publicly
  -- accessible asset if you want a visible image (or set to NULL).
  insert into public.posts (image_url, description, type, location, amount, uploader, uploader_id, created_at)
  values ('/simages/scrapcompany.jpeg',
          'Welcome to ScrapLink! This post was automatically created for your account.',
          'Welcome', 'Unknown', 0, coalesce(new.email, 'New User'), new.id, now())
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger that listens for new rows in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security on profiles
alter table public.profiles enable row level security;

-- Allow public SELECT on profiles (optional)
create policy "public_select_profiles" on public.profiles
  for select using (true);

-- Allow users to insert/update/delete their own profile
create policy "users_manage_own_profile_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "users_manage_own_profile_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "users_manage_own_profile_delete" on public.profiles
  for delete using (auth.uid() = id);

-- End of migration
