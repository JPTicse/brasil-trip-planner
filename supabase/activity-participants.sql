-- Tabla de participantes en actividades (quién se une a un plan)
create table if not exists public.activity_participants (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(activity_id, user_id)
);

-- RLS: visible y editable por miembros del viaje
alter table public.activity_participants enable row level security;

create policy "Activity participants viewable by trip members"
  on public.activity_participants for select to authenticated
  using (
    exists (
      select 1 from public.activities a
      join public.trip_members tm on tm.trip_id = a.trip_id
      where a.id = activity_id and tm.user_id = auth.uid()
    )
  );

create policy "Activity participants insertable by trip members"
  on public.activity_participants for insert to authenticated
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from public.activities a
      join public.trip_members tm on tm.trip_id = a.trip_id
      where a.id = activity_id and tm.user_id = auth.uid()
    )
  );

create policy "Activity participants deletable by own user"
  on public.activity_participants for delete to authenticated
  using (user_id = auth.uid());

-- Habilitar realtime
alter publication supabase_realtime add table public.activity_participants;
