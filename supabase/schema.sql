-- ============================================================================
-- Brasil Trip Planner — Esquema de base de datos
-- ============================================================================
-- Ejecuta este script en el SQL Editor de Supabase:
--   https://supabase.com/dashboard/project/_/sql
--
-- Crea las tablas, políticas RLS y un trigger que genera un perfil
-- automáticamente cuando un usuario se registra con Google.
-- ============================================================================

-- Tabla de perfiles (extiende auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Viajes
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text,
  start_date date,
  end_date date,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Miembros de cada viaje
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member', -- 'owner' | 'member'
  joined_at timestamptz not null default now(),
  unique(trip_id, user_id)
);

-- Actividades del itinerario
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  title text not null,
  type text not null default 'visit', -- visit | tour | meal | event | free | transport
  location text,
  cost numeric(12, 2),
  currency text not null default 'BRL',
  notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Alojamientos (hoteles)
create table if not exists public.accommodations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  address text,
  check_in date,
  check_out date,
  cost numeric(12, 2),
  currency text not null default 'BRL',
  booking_url text,
  booked_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- Transporte (vuelos, autobuses, coches, etc.)
create table if not exists public.transports (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  type text not null, -- flight | bus | car | taxi | boat | train
  from_location text,
  to_location text,
  departure_at timestamptz,
  arrival_at timestamptz,
  cost numeric(12, 2),
  currency text not null default 'BRL',
  booking_url text,
  booked_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- Gastos compartidos
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'BRL',
  paid_by uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  category text not null default 'other', -- food | transport | accommodation | activity | other
  created_at timestamptz not null default now()
);

-- Reparto de gastos (quién debe cuánto)
create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null,
  settled boolean not null default false,
  unique(expense_id, user_id)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.activities enable row level security;
alter table public.accommodations enable row level security;
alter table public.transports enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;

-- Perfiles: cualquiera autenticado puede leer; cada usuario edita el suyo
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Viajes: visibles para los miembros del viaje
create policy "Trips are viewable by members"
  on public.trips for select to authenticated
  using (
    id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Users can create trips"
  on public.trips for insert to authenticated
  with check (created_by = auth.uid());

create policy "Users can update trips they belong to"
  on public.trips for update to authenticated
  using (
    id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Users can delete trips they own"
  on public.trips for delete to authenticated
  using (
    id in (
      select trip_id from public.trip_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- Miembros de viaje: visibles para miembros del mismo viaje
create policy "Trip members are viewable by trip members"
  on public.trip_members for select to authenticated
  using (
    trip_id in (select trip_id from public.trip_members tm where tm.user_id = auth.uid())
  );

create policy "Users can add members to their trips"
  on public.trip_members for insert to authenticated
  with check (
    trip_id in (
      select trip_id from public.trip_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create policy "Owners can remove members"
  on public.trip_members for delete to authenticated
  using (
    trip_id in (
      select trip_id from public.trip_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- Función helper: ¿el usuario actual es miembro del viaje?
create or replace function public.is_trip_member(trip uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = trip and user_id = auth.uid()
  );
$$;

-- Actividades, alojamientos, transporte, gastos y repartos:
-- visibles y editables por miembros del viaje
create policy "Activities viewable by trip members"
  on public.activities for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "Activities insertable by trip members"
  on public.activities for insert to authenticated
  with check (public.is_trip_member(trip_id));

create policy "Activities updatable by trip members"
  on public.activities for update to authenticated
  using (public.is_trip_member(trip_id));

create policy "Activities deletable by trip members"
  on public.activities for delete to authenticated
  using (public.is_trip_member(trip_id));

create policy "Accommodations viewable by trip members"
  on public.accommodations for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "Accommodations insertable by trip members"
  on public.accommodations for insert to authenticated
  with check (public.is_trip_member(trip_id));

create policy "Accommodations updatable by trip members"
  on public.accommodations for update to authenticated
  using (public.is_trip_member(trip_id));

create policy "Accommodations deletable by trip members"
  on public.accommodations for delete to authenticated
  using (public.is_trip_member(trip_id));

create policy "Transports viewable by trip members"
  on public.transports for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "Transports insertable by trip members"
  on public.transports for insert to authenticated
  with check (public.is_trip_member(trip_id));

create policy "Transports updatable by trip members"
  on public.transports for update to authenticated
  using (public.is_trip_member(trip_id));

create policy "Transports deletable by trip members"
  on public.transports for delete to authenticated
  using (public.is_trip_member(trip_id));

create policy "Expenses viewable by trip members"
  on public.expenses for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "Expenses insertable by trip members"
  on public.expenses for insert to authenticated
  with check (public.is_trip_member(trip_id));

create policy "Expenses updatable by trip members"
  on public.expenses for update to authenticated
  using (public.is_trip_member(trip_id));

create policy "Expenses deletable by trip members"
  on public.expenses for delete to authenticated
  using (public.is_trip_member(trip_id));

create policy "Expense splits viewable by trip members"
  on public.expense_splits for select to authenticated
  using (
    expense_id in (
      select e.id from public.expenses e
      where public.is_trip_member(e.trip_id)
    )
  );

create policy "Expense splits insertable by trip members"
  on public.expense_splits for insert to authenticated
  with check (
    expense_id in (
      select e.id from public.expenses e
      where public.is_trip_member(e.trip_id)
    )
  );

create policy "Expense splits updatable by trip members"
  on public.expense_splits for update to authenticated
  using (
    expense_id in (
      select e.id from public.expenses e
      where public.is_trip_member(e.trip_id)
    )
  );

create policy "Expense splits deletable by trip members"
  on public.expense_splits for delete to authenticated
  using (
    expense_id in (
      select e.id from public.expenses e
      where public.is_trip_member(e.trip_id)
    )
  );

-- ============================================================================
-- Trigger: crear perfil automáticamente al registrarse
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
