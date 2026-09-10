-- Añadir coordenadas a actividades para mapas
alter table public.activities add column if not exists location_lat double precision;
alter table public.activities add column if not exists location_lng double precision;

-- Añadir ubicación GPS a perfiles (compartir ubicación entre miembros)
alter table public.profiles add column if not exists location_lat double precision;
alter table public.profiles add column if not exists location_lng double precision;
alter table public.profiles add column if not exists location_updated_at timestamptz;

-- Permitir que usuarios actualicen su propia ubicación
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);
