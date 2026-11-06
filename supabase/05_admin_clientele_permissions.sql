-- ============================================================================
-- MARSH BARBARY — CLIENTELE & ORDERS ADMIN PERMISSIONS
-- Run this in the Supabase SQL Editor to allow the Admin Panel to view
-- profiles, customer accounts, saved addresses, and live orders.
-- ============================================================================

-- 1. Profiles & Customer Profiles
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for admin clientele view" ON public.profiles;
    CREATE POLICY "Enable read access for admin clientele view" ON public.profiles FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_profiles') THEN
    ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for admin clientele view" ON public.customer_profiles;
    CREATE POLICY "Enable read access for admin clientele view" ON public.customer_profiles FOR SELECT USING (true);
  END IF;
END $$;

-- 2. Customer Addresses
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'addresses') THEN
    ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for admin clientele view" ON public.addresses;
    CREATE POLICY "Enable read access for admin clientele view" ON public.addresses FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_addresses') THEN
    ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable read access for admin clientele view" ON public.customer_addresses;
    CREATE POLICY "Enable read access for admin clientele view" ON public.customer_addresses FOR SELECT USING (true);
  END IF;
END $$;

-- 3. Orders & Order Items
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all access for orders" ON public.orders;
    CREATE POLICY "Enable all access for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all access for order_items" ON public.order_items;
    CREATE POLICY "Enable all access for order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
