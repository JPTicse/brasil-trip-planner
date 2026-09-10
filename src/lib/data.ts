import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type {
  Activity,
  Accommodation,
  Expense,
  ExpenseSplit,
  Profile,
  Transport,
  Trip,
  TripMember,
} from "@/lib/types";

// --- Perfiles ---

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

// --- Viajes ---

export async function getTrips(): Promise<(Trip & { member_count: number })[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("trips")
    .select(
      `
      *,
      trip_members(count)
    `,
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((t) => ({
    ...t,
    member_count: t.trip_members?.[0]?.count ?? 0,
  })) as (Trip & { member_count: number })[];
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();
  return data as Trip | null;
}

export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("trip_members")
    .select("*, profile:profiles(*)")
    .eq("trip_id", tripId)
    .order("joined_at", { ascending: true });
  return (data ?? []) as TripMember[];
}

// --- Itinerario ---

export async function getActivities(tripId: string): Promise<Activity[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("activities")
    .select("*, assignee:profiles!assigned_to(*)")
    .eq("trip_id", tripId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: false });
  return (data ?? []) as Activity[];
}

// --- Alojamientos ---

export async function getAccommodations(
  tripId: string,
): Promise<Accommodation[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("accommodations")
    .select("*, booker:profiles!booked_by(*)")
    .eq("trip_id", tripId)
    .order("check_in", { ascending: true, nullsFirst: false });
  return (data ?? []) as Accommodation[];
}

// --- Transporte ---

export async function getTransports(tripId: string): Promise<Transport[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("transports")
    .select("*, booker:profiles!booked_by(*)")
    .eq("trip_id", tripId)
    .order("departure_at", { ascending: true, nullsFirst: false });
  return (data ?? []) as Transport[];
}

// --- Gastos ---

export async function getExpenses(tripId: string): Promise<Expense[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("expenses")
    .select("*, payer:profiles!paid_by(*), splits:expense_splits(*, profile:profiles!user_id(*))")
    .eq("trip_id", tripId)
    .order("date", { ascending: false });
  return (data ?? []) as Expense[];
}

export async function getExpenseSplits(
  expenseId: string,
): Promise<ExpenseSplit[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("expense_splits")
    .select("*, profile:profiles!user_id(*)")
    .eq("expense_id", expenseId);
  return (data ?? []) as ExpenseSplit[];
}

// --- Resumen de saldos entre miembros ---

export type Balance = {
  profile: Profile;
  // Positivo = le deben dinero; negativo = debe dinero
  net: number;
};

export async function getTripBalances(tripId: string): Promise<Balance[]> {
  const expenses = await getExpenses(tripId);
  const members = await getTripMembers(tripId);

  const balances = new Map<string, number>();
  for (const m of members) {
    balances.set(m.user_id, 0);
  }

  for (const expense of expenses) {
    // El que paga recibe crédito por el total
    balances.set(
      expense.paid_by,
      (balances.get(expense.paid_by) ?? 0) + expense.amount,
    );
    // Cada split resta lo que debe
    for (const split of expense.splits ?? []) {
      balances.set(
        split.user_id,
        (balances.get(split.user_id) ?? 0) - split.amount,
      );
    }
  }

  const profileMap = new Map<string, Profile>();
  for (const m of members) {
    if (m.profile) profileMap.set(m.user_id, m.profile);
  }

  return members.map((m) => ({
    profile: profileMap.get(m.user_id) ?? { id: m.user_id, name: null, avatar_url: null, created_at: "" },
    net: balances.get(m.user_id) ?? 0,
  }));
}
