-- ============================================================================
-- MARSH BARBARY — RAZORPAY WEBHOOK INTEGRATION SCHEMA & PERMISSIONS (SLICE 8)
-- ============================================================================

-- Ensure orders table has all status columns & indexes for webhook lookup
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_order_number on public.orders(order_number);

-- Ensure RLS allows service_role and backend updates
-- Note: Supabase Service Role Key bypasses RLS automatically.
-- For environments using anon key with webhook endpoints, grant update policy:
drop policy if exists "Enable webhook update on orders" on public.orders;
create policy "Enable webhook update on orders"
  on public.orders
  for update
  using (true)
  with check (true);

-- Optional: Webhook Events audit table for permanent idempotency and logging
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  event_name text not null,
  provider text not null default 'RAZORPAY',
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.webhook_events enable row level security;
drop policy if exists "Enable all for webhook_events" on public.webhook_events;
create policy "Enable all for webhook_events"
  on public.webhook_events
  for all
  using (true)
  with check (true);
