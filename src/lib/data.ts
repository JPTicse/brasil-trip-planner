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
  TripWithAccess,
  TripMember,
  TripAccessRequest,
} from "@/lib/types";

// --- Autorización ---

// Verifica si el usuario actual es miembro del viaje.
// Usa el cliente admin (bypass RLS) para evitar recursión.
async function isTripMember(tripId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

// Verifica si el usuario actual es owner del viaje.
async function isTripOwner(tripId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();
  return !!data;
}

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

export async function getTrips(): Promise<TripWithAccess[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = createSupabaseAdminClient();

  // Obtener todos los viajes
  const { data: trips } = await supabase
    .from("trips")
    .select(
      `
      *,
      trip_members(count)
    `,
    )
    .order("created_at", { ascending: false });

  if (!trips) return [];

  // Obtener los trip_ids donde el usuario es miembro
  const { data: memberships } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", user.id);
  const memberTripIds = new Set((memberships ?? []).map((m) => m.trip_id));

  // Obtener las solicitudes de acceso del usuario
  const { data: requests } = await supabase
    .from("trip_access_requests")
    .select("trip_id, status")
    .eq("user_id", user.id);
  const requestStatusByTrip = new Map(
    (requests ?? []).map((r) => [r.trip_id, r.status]),
  );

  return trips.map((t) => ({
    ...t,
    member_count: t.trip_members?.[0]?.count ?? 0,
    is_member: memberTripIds.has(t.id),
    access_request_status: requestStatusByTrip.get(t.id) ?? null,
  })) as TripWithAccess[];
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
  const member = await isTripMember(tripId);
  if (!member) return [];

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
  const member = await isTripMember(tripId);
  if (!member) return [];

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
  const member = await isTripMember(tripId);
  if (!member) return [];

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
  const member = await isTripMember(tripId);
  if (!member) return [];

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
  const member = await isTripMember(tripId);
  if (!member) return [];

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
  const member = await isTripMember(tripId);
  if (!member) return [];

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

// Exportar helpers de autorización para usar en Server Actions
export { isTripMember, isTripOwner };

// --- Quién debe a quién ---

export type Debt = {
  from: Profile; // quien debe
  to: Profile; // a quien le debe
  amount: number;
};

export async function getTripDebts(tripId: string): Promise<Debt[]> {
  const member = await isTripMember(tripId);
  if (!member) return [];

  const expenses = await getExpenses(tripId);
  const members = await getTripMembers(tripId);

  // Calcular saldo neto de cada miembro
  const balances = new Map<string, number>();
  for (const m of members) {
    balances.set(m.user_id, 0);
  }

  for (const expense of expenses) {
    balances.set(
      expense.paid_by,
      (balances.get(expense.paid_by) ?? 0) + expense.amount,
    );
    for (const split of expense.splits ?? []) {
      balances.set(
        split.user_id,
        (balances.get(split.user_id) ?? 0) - split.amount,
      );
    }
  }

  // Solo considerar splits no saldados para las deudas activas
  const unsettledBalances = new Map<string, number>();
  for (const m of members) {
    unsettledBalances.set(m.user_id, 0);
  }

  for (const expense of expenses) {
    for (const split of expense.splits ?? []) {
      if (!split.settled && split.user_id !== expense.paid_by) {
        unsettledBalances.set(
          split.user_id,
          (unsettledBalances.get(split.user_id) ?? 0) - split.amount,
        );
        unsettledBalances.set(
          expense.paid_by,
          (unsettledBalances.get(expense.paid_by) ?? 0) + split.amount,
        );
      }
    }
  }

  // Algoritmo de minimización de transacciones: separar deudores y acreedores
  const profileMap = new Map<string, Profile>();
  for (const m of members) {
    if (m.profile) profileMap.set(m.user_id, m.profile);
  }

  const getProfile = (id: string): Profile =>
    profileMap.get(id) ?? { id, name: null, avatar_url: null, created_at: "" };

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  for (const [id, balance] of unsettledBalances) {
    if (balance < -0.01) debtors.push({ id, amount: -balance });
    else if (balance > 0.01) creditors.push({ id, amount: balance });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // Emparejar deudores con acreedores
  const debts: Debt[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debt = Math.min(debtors[i].amount, creditors[j].amount);
    debts.push({
      from: getProfile(debtors[i].id),
      to: getProfile(creditors[j].id),
      amount: Math.round(debt * 100) / 100,
    });

    debtors[i].amount -= debt;
    creditors[j].amount -= debt;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return debts;
}

// --- Solicitudes de acceso ---

// Obtiene la solicitud de acceso del usuario actual para un viaje
export async function getMyAccessRequest(
  tripId: string,
): Promise<TripAccessRequest | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("trip_access_requests")
    .select("*")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data as TripAccessRequest | null;
}

// Obtiene todas las solicitudes pendientes para un viaje (para owners)
export async function getPendingAccessRequests(
  tripId: string,
): Promise<TripAccessRequest[]> {
  const owner = await isTripOwner(tripId);
  if (!owner) return [];

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("trip_access_requests")
    .select("*, profile:profiles!user_id(*)")
    .eq("trip_id", tripId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []) as TripAccessRequest[];
}
