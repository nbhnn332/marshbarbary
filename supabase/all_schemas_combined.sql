-- ============================================================================
-- MARSH BARBARY — SUPABASE COMPLETE DATABASE SCHEMA
-- ============================================================================

-- 0. Clean up any outdated/conflicting previous definitions
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_customer() cascade;
drop function if exists public.handle_default_address() cascade;
drop function if exists public.set_updated_at() cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.customer_addresses cascade;
drop table if exists public.customer_profiles cascade;

-- 1. Create customer_profiles table linked to Supabase Auth
create table public.customer_profiles (
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
-- ============================================================================
-- MARSH BARBARY — CUSTOMER SAVED ADDRESSES SCHEMA (SLICE 3)
-- ============================================================================

-- 1. Create customer_addresses table
create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customer_profiles(id) on delete cascade,
  address_label text not null default 'Home', -- 'Home', 'Work', 'Other'
  full_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  landmark text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for lightning-fast querying by user
create index if not exists idx_customer_addresses_auth_user_id on public.customer_addresses(auth_user_id);
create index if not exists idx_customer_addresses_customer_id on public.customer_addresses(customer_id);
create index if not exists idx_customer_addresses_is_default on public.customer_addresses(auth_user_id, is_default);

-- 2. Row Level Security (RLS)
alter table public.customer_addresses enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Customers can view their own addresses" on public.customer_addresses;
drop policy if exists "Customers can insert their own addresses" on public.customer_addresses;
drop policy if exists "Customers can update their own addresses" on public.customer_addresses;
drop policy if exists "Customers can delete their own addresses" on public.customer_addresses;

-- Policies:
create policy "Customers can view their own addresses"
  on public.customer_addresses
  for select
  using (auth.uid() = auth_user_id);

create policy "Customers can insert their own addresses"
  on public.customer_addresses
  for insert
  with check (auth.uid() = auth_user_id);

create policy "Customers can update their own addresses"
  on public.customer_addresses
  for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create policy "Customers can delete their own addresses"
  on public.customer_addresses
  for delete
  using (auth.uid() = auth_user_id);

-- 3. Trigger to maintain a single default address per user
create or replace function public.handle_default_address()
returns trigger
language plpgsql
as $$
declare
  addr_count integer;
begin
  -- Check how many addresses the user already has
  select count(*) into addr_count
  from public.customer_addresses
  where auth_user_id = new.auth_user_id and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- If this is the user's first address, force is_default = true
  if addr_count = 0 then
    new.is_default := true;
  end if;

  -- If new/updated address is default, unset default for all other addresses of this user
  if new.is_default = true then
    update public.customer_addresses
    set is_default = false
    where auth_user_id = new.auth_user_id and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_manage_default_address on public.customer_addresses;
create trigger trigger_manage_default_address
  before insert or update on public.customer_addresses
  for each row execute function public.handle_default_address();

-- 4. Auto-update updated_at timestamp
drop trigger if exists set_customer_addresses_updated_at on public.customer_addresses;
create trigger set_customer_addresses_updated_at
  before update on public.customer_addresses
  for each row execute function public.set_updated_at();
-- ============================================================================
-- MARSH BARBARY — ORDERS & ORDER ITEMS SCHEMA WITH SNAPSHOTTED ADDRESS (SLICE 7)
-- ============================================================================

-- 1. Create orders table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customer_profiles(id) on delete set null,
  selected_address_id uuid references public.customer_addresses(id) on delete set null,
  
  -- Immutable shipping address snapshot
  shipping_full_name text not null,
  shipping_phone text not null,
  shipping_address_line_1 text not null,
  shipping_address_line_2 text,
  shipping_landmark text,
  shipping_city text not null,
  shipping_state text not null,
  shipping_postal_code text not null,
  shipping_country text not null default 'India',

  -- Financial breakdown
  subtotal numeric(10,2) not null,
  shipping_fee numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,

  -- Status & Fulfillment
  status text not null default 'PENDING', -- 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'
  payment_method text not null default 'COD', -- 'RAZORPAY', 'PHONEPE', 'COD'
  payment_status text not null default 'PENDING', -- 'PENDING', 'PAID', 'FAILED', 'REFUNDED'
  tracking_carrier text,
  tracking_number text,
  tracking_url text,
  notes text,
  timeline jsonb default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create order_items table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  sku text,
  size text,
  color text,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_orders_auth_user_id on public.orders(auth_user_id);
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- 3. Row Level Security (RLS)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Orders policies
drop policy if exists "Customers can view their own orders" on public.orders;
drop policy if exists "Customers can place orders" on public.orders;
drop policy if exists "Customers cannot modify existing orders" on public.orders;

create policy "Customers can view their own orders"
  on public.orders
  for select
  using (auth.uid() = auth_user_id);

create policy "Customers can place orders"
  on public.orders
  for insert
  with check (auth.uid() = auth_user_id);

-- Order items policies
drop policy if exists "Customers can view their order items" on public.order_items;
drop policy if exists "Customers can insert order items" on public.order_items;

create policy "Customers can view their order items"
  on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.auth_user_id = auth.uid()
    )
  );

create policy "Customers can insert order items"
  on public.order_items
  for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.auth_user_id = auth.uid()
    )
  );

-- Auto-update updated_at on orders
drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
