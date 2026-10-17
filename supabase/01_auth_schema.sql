-- ============================================================================
-- MARSH BARBARY — SUPABASE AUTH & CUSTOMER PROFILES SCHEMA (SLICE 1)
-- ============================================================================

-- 1. Create customer_profiles table linked to Supabase Auth
create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for instant lookup by auth_user_id and email
create index if not exists idx_customer_profiles_auth_user_id on public.customer_profiles(auth_user_id);
create index if not exists idx_customer_profiles_email on public.customer_profiles(lower(email));

-- 2. Row Level Security (RLS)
alter table public.customer_profiles enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Customers can view their own profile" on public.customer_profiles;
drop policy if exists "Customers can update their own profile" on public.customer_profiles;
drop policy if exists "Customers can insert their own profile" on public.customer_profiles;
drop policy if exists "Service role and admin can manage all profiles" on public.customer_profiles;

-- Policies:
-- Customer can only view their own profile
create policy "Customers can view their own profile"
  on public.customer_profiles
  for select
  using (auth.uid() = auth_user_id);

-- Customer can only update their own profile
create policy "Customers can update their own profile"
  on public.customer_profiles
  for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Customer can insert their profile upon registration
create policy "Customers can insert their own profile"
  on public.customer_profiles
  for insert
  with check (auth.uid() = auth_user_id);

-- 3. Automatic Profile Creation Trigger on Supabase Auth Sign Up
create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_profiles (
    auth_user_id,
    email,
    first_name,
    last_name,
    phone
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (auth_user_id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

-- Trigger firing on every new user in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_customer();

-- 4. Auto-update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_customer_profiles_updated_at on public.customer_profiles;
create trigger set_customer_profiles_updated_at
  before update on public.customer_profiles
  for each row execute function public.set_updated_at();
