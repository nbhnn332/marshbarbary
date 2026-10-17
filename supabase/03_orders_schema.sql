-- ============================================================================
-- MARSH BARBARY — ORDERS & ORDER ITEMS SCHEMA WITH SNAPSHOTTED ADDRESS (SLICE 7)
-- ============================================================================

-- 1. Create orders table
create table if not exists public.orders (
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
create table if not exists public.order_items (
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
