-- ============================================================================
-- MARSH BARBARY — TRACKING & FULFILLMENT COLUMNS MIGRATION
-- Run this in your Supabase SQL Editor to enable native tracking columns.
-- ============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_carrier text,
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS tracking_url text,
ADD COLUMN IF NOT EXISTS timeline jsonb default '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status text;

-- Keep status and order_status in sync if both columns exist
UPDATE public.orders SET status = order_status WHERE status IS NULL;
UPDATE public.orders SET order_status = status WHERE order_status IS NULL;

-- Ensure RLS allows public/anon updates on orders table
DROP POLICY IF EXISTS "Enable admin update on orders" ON public.orders;
CREATE POLICY "Enable admin update on orders"
  ON public.orders
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
