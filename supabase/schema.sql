-- ==========================================================================
-- HMY Store — Cloud catalog + site content + media storage
-- Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (Safe to run again; it will not delete any data.)
-- ==========================================================================

-- 1) Products (one row per product, full product object in "data")
create table if not exists public.products (
  id          bigint primary key,
  data        jsonb not null,
  updated_at  timestamptz default now()
);

-- 2) Site content (keys: content, category_images, products_initialized)
create table if not exists public.site_content (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz default now()
);

alter table public.products     enable row level security;
alter table public.site_content enable row level security;

-- Everyone can READ (storefront). Only logged-in admin can WRITE.
drop policy if exists "Public read products"   on public.products;
drop policy if exists "Admin insert products"  on public.products;
drop policy if exists "Admin update products"  on public.products;
drop policy if exists "Admin delete products"  on public.products;

create policy "Public read products"  on public.products for select using (true);
create policy "Admin insert products" on public.products for insert to authenticated with check (true);
create policy "Admin update products" on public.products for update to authenticated using (true) with check (true);
create policy "Admin delete products" on public.products for delete to authenticated using (true);

drop policy if exists "Public read site_content"  on public.site_content;
drop policy if exists "Admin insert site_content" on public.site_content;
drop policy if exists "Admin update site_content" on public.site_content;
drop policy if exists "Admin delete site_content" on public.site_content;

create policy "Public read site_content"  on public.site_content for select using (true);
create policy "Admin insert site_content" on public.site_content for insert to authenticated with check (true);
create policy "Admin update site_content" on public.site_content for update to authenticated using (true) with check (true);
create policy "Admin delete site_content" on public.site_content for delete to authenticated using (true);

-- 3) Storage bucket for product images, category banners and videos
insert into storage.buckets (id, name, public, file_size_limit)
values ('store-media', 'store-media', true, 52428800)   -- 50 MB per file
on conflict (id) do update set public = true;

drop policy if exists "Public read store-media"   on storage.objects;
drop policy if exists "Admin upload store-media"  on storage.objects;
drop policy if exists "Admin update store-media"  on storage.objects;
drop policy if exists "Admin delete store-media"  on storage.objects;

create policy "Public read store-media"  on storage.objects for select using (bucket_id = 'store-media');
create policy "Admin upload store-media" on storage.objects for insert to authenticated with check (bucket_id = 'store-media');
create policy "Admin update store-media" on storage.objects for update to authenticated using (bucket_id = 'store-media');
create policy "Admin delete store-media" on storage.objects for delete to authenticated using (bucket_id = 'store-media');
