-- Run this in Supabase SQL editor before using live uploads.
-- This demo setup allows public reads and public inserts/uploads from the static site.
-- For production, replace public insert/upload policies with authenticated admin-only policies.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  price integer not null check (price > 0),
  description text not null,
  image_url text not null,
  image_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.properties
add column if not exists image_urls jsonb not null default '[]'::jsonb;

alter table public.properties enable row level security;

drop policy if exists "Public can read properties" on public.properties;
create policy "Public can read properties"
on public.properties
for select
using (true);

drop policy if exists "Public can add properties demo" on public.properties;
create policy "Public can add properties demo"
on public.properties
for insert
with check (true);

drop policy if exists "Public can update properties demo" on public.properties;
create policy "Public can update properties demo"
on public.properties
for update
using (true)
with check (true);

drop policy if exists "Public can delete properties demo" on public.properties;
create policy "Public can delete properties demo"
on public.properties
for delete
using (true);

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read property images" on storage.objects;
create policy "Public can read property images"
on storage.objects
for select
using (bucket_id = 'property-images');

drop policy if exists "Public can upload property images demo" on storage.objects;
create policy "Public can upload property images demo"
on storage.objects
for insert
with check (bucket_id = 'property-images');
-- ── Bookings table ────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  room text not null,
  check_in date not null,
  check_out date not null,
  adults integer default 1,
  children integer default 0,
  requests text,
  total_amount numeric default 0,
  status text default 'confirmed',
  booked_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "Public can read bookings" on public.bookings;
create policy "Public can read bookings"
on public.bookings for select using (true);

drop policy if exists "Public can insert bookings" on public.bookings;
create policy "Public can insert bookings"
on public.bookings for insert with check (true);

drop policy if exists "Public can update bookings" on public.bookings;
create policy "Public can update bookings"
on public.bookings for update using (true) with check (true);

-- ── CCAvenue columns (run once, safe to re-run) ───────────────────────────────
alter table public.bookings
  add column if not exists order_id text,
  add column if not exists payment_tracking_id text;

-- Index for fast lookups by CCAvenue order_id on payment return
create index if not exists bookings_order_id_idx on public.bookings (order_id);

-- ── Enable Realtime on bookings so admin panel updates live ──────────────────
-- Run this once in Supabase SQL Editor
alter publication supabase_realtime add table public.bookings;
