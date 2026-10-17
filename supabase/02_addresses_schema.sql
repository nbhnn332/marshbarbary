-- ============================================================================
-- MARSH BARBARY — CUSTOMER SAVED ADDRESSES SCHEMA (SLICE 3)
-- ============================================================================

-- 1. Create customer_addresses table
create table if not exists public.customer_addresses (
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
