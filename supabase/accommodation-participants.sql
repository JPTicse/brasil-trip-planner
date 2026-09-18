create table if not exists public.accommodation_participants (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(accommodation_id, user_id)
);

alter table public.accommodation_participants enable row level security;

drop policy if exists "Accommodation participants viewable by trip members" on public.accommodation_participants;
create policy "Accommodation participants viewable by trip members"
  on public.accommodation_participants for select to authenticated
  using (
    exists (
      select 1 from public.accommodations a
      join public.trip_members tm on tm.trip_id = a.trip_id
      where a.id = accommodation_id and tm.user_id = auth.uid()
    )
  );

drop policy if exists "Accommodation participants manageable by trip members" on public.accommodation_participants;
create policy "Accommodation participants manageable by trip members"
  on public.accommodation_participants for insert to authenticated
  with check (
    exists (
      select 1 from public.accommodations a
      join public.trip_members actor on actor.trip_id = a.trip_id and actor.user_id = auth.uid()
      join public.trip_members participant on participant.trip_id = a.trip_id and participant.user_id = accommodation_participants.user_id
      where a.id = accommodation_participants.accommodation_id
    )
  );

drop policy if exists "Accommodation participants removable by trip members" on public.accommodation_participants;
create policy "Accommodation participants removable by trip members"
  on public.accommodation_participants for delete to authenticated
  using (
    exists (
      select 1 from public.accommodations a
      join public.trip_members tm on tm.trip_id = a.trip_id
      where a.id = accommodation_id and tm.user_id = auth.uid()
    )
  );

insert into public.accommodation_participants (accommodation_id, user_id)
select id, booked_by
from public.accommodations
where booked_by is not null
on conflict (accommodation_id, user_id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'accommodation_participants'
  ) then
    alter publication supabase_realtime add table public.accommodation_participants;
  end if;
end $$;
