-- ============================================================================
-- Fix: infinite recursion in RLS policies for trip_members and trips
-- ============================================================================
-- The problem: trip_members policies reference trip_members in subqueries,
-- and trips policies reference trip_members in subqueries, causing infinite
-- recursion. Fix: use SECURITY DEFINER functions that bypass RLS.
-- ============================================================================

-- Drop problematic policies on trip_members
drop policy if exists "Trip members are viewable by trip members" on public.trip_members;
drop policy if exists "Users can add members to their trips" on public.trip_members;
drop policy if exists "Owners can remove members" on public.trip_members;

-- Drop problematic policies on trips
drop policy if exists "Trips are viewable by members" on public.trips;
drop policy if exists "Users can update trips they belong to" on public.trips;
drop policy if exists "Users can delete trips they own" on public.trips;

-- ============================================================================
-- Helper functions (SECURITY DEFINER = bypass RLS, no recursion)
-- ============================================================================

-- is_trip_member already exists, but let's ensure it's correct
create or replace function public.is_trip_member(trip uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = trip and user_id = auth.uid()
  );
$$;

-- New: check if current user is an owner of the trip
create or replace function public.is_trip_owner(trip uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = trip and user_id = auth.uid() and role = 'owner'
  );
$$;

-- New: check if current user created the trip
create or replace function public.is_trip_creator(trip uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.trips
    where id = trip and created_by = auth.uid()
  );
$$;

-- ============================================================================
-- Recreate policies using helper functions (no subqueries = no recursion)
-- ============================================================================

-- Trips: visible/editable for members; deletable by owners
create policy "Trips are viewable by members"
  on public.trips for select to authenticated
  using (public.is_trip_member(id));

create policy "Users can update trips they belong to"
  on public.trips for update to authenticated
  using (public.is_trip_member(id));

create policy "Users can delete trips they own"
  on public.trips for delete to authenticated
  using (public.is_trip_owner(id));

-- Trip members: visible for members; insertable by owners or trip creator
-- (initial owner insert); deletable by owners
create policy "Trip members are viewable by trip members"
  on public.trip_members for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "Users can add members to their trips"
  on public.trip_members for insert to authenticated
  with check (
    public.is_trip_owner(trip_id)
    or (user_id = auth.uid() and public.is_trip_creator(trip_id))
  );

create policy "Owners can remove members"
  on public.trip_members for delete to authenticated
  using (public.is_trip_owner(trip_id));
