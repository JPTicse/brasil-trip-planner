-- ============================================================================
-- Tabla de solicitudes de acceso a viajes
-- ============================================================================
create table if not exists public.trip_access_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending', -- pending | approved | rejected
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  unique(trip_id, user_id)
);

-- Cuando se aprueba una solicitud, añadir al usuario como miembro
create or replace function public.handle_access_approval()
returns trigger
language plpgsql security definer
as $$
begin
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    insert into public.trip_members (trip_id, user_id, role)
    values (new.trip_id, new.user_id, 'member')
    on conflict (trip_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_access_request_update on public.trip_access_requests;
create trigger on_access_request_update
  after insert or update of status on public.trip_access_requests
  for each row execute function public.handle_access_approval();
