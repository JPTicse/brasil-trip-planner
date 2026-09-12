-- Tabla de inspiraciones (cache de lugares recomendados por Google Places)
create table if not exists public.inspirations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id text not null,
  title text not null,
  address text,
  image_url text,
  rating numeric(3, 1),
  price_level smallint,
  types text[] not null default '{}',
  suggested_type text not null default 'visit',
  location text,
  lat double precision,
  lng double precision,
  cost_estimate numeric(12, 2),
  currency text not null default 'BRL',
  cached_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique(trip_id, place_id)
);

create index if not exists idx_inspirations_trip_id
  on public.inspirations(trip_id);
create index if not exists idx_inspirations_trip_expires
  on public.inspirations(trip_id, expires_at);

alter table public.inspirations enable row level security;

create policy "Inspirations viewable by trip members"
  on public.inspirations for select to authenticated
  using (public.is_trip_member(trip_id));
