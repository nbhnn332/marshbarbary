-- ============================================================================
-- MARSH BARBARY — ENABLE ADMIN MANAGEMENT (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================================

-- Products
alter table public.products enable row level security;
drop policy if exists "Enable all for products" on public.products;
create policy "Enable all for products" on public.products for all using (true) with check (true);

-- Product Images
alter table public.product_images enable row level security;
drop policy if exists "Enable all for product_images" on public.product_images;
create policy "Enable all for product_images" on public.product_images for all using (true) with check (true);

-- Product Variants
alter table public.product_variants enable row level security;
drop policy if exists "Enable all for product_variants" on public.product_variants;
create policy "Enable all for product_variants" on public.product_variants for all using (true) with check (true);

-- Categories
alter table public.categories enable row level security;
drop policy if exists "Enable all for categories" on public.categories;
create policy "Enable all for categories" on public.categories for all using (true) with check (true);

-- Hero Content
alter table public.hero_content enable row level security;
drop policy if exists "Enable all for hero_content" on public.hero_content;
create policy "Enable all for hero_content" on public.hero_content for all using (true) with check (true);
