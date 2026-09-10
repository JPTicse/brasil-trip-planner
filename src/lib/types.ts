// Tipos que reflejan el esquema de supabase/schema.sql

export type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

export type TripMember = {
  id: string;
  trip_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  // Join manual con profiles
  profile?: Profile;
};

export type ActivityType =
  | "visit"
  | "tour"
  | "meal"
  | "event"
  | "free"
  | "transport";

export type Activity = {
  id: string;
  trip_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  type: ActivityType;
  location: string | null;
  cost: number | null;
  currency: string;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  // Joins
  assignee?: Profile | null;
};

export type Accommodation = {
  id: string;
  trip_id: string;
  name: string;
  address: string | null;
  check_in: string | null;
  check_out: string | null;
  cost: number | null;
  currency: string;
  booking_url: string | null;
  booked_by: string | null;
  notes: string | null;
  created_at: string;
  // Join
  booker?: Profile | null;
};

export type TransportType =
  | "flight"
  | "bus"
  | "car"
  | "taxi"
  | "boat"
  | "train";

export type Transport = {
  id: string;
  trip_id: string;
  type: TransportType;
  from_location: string | null;
  to_location: string | null;
  departure_at: string | null;
  arrival_at: string | null;
  cost: number | null;
  currency: string;
  booking_url: string | null;
  booked_by: string | null;
  notes: string | null;
  created_at: string;
  // Join
  booker?: Profile | null;
};

export type ExpenseCategory =
  | "food"
  | "transport"
  | "accommodation"
  | "activity"
  | "other";

export type Expense = {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  date: string;
  category: ExpenseCategory;
  created_at: string;
  // Joins
  payer?: Profile | null;
  splits?: ExpenseSplit[];
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  settled: boolean;
  // Join
  profile?: Profile | null;
};

// Etiquetas legibles para los enums de la UI
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  visit: "Visita",
  tour: "Tour",
  meal: "Comida",
  event: "Evento",
  free: "Tiempo libre",
  transport: "Transporte",
};

export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  flight: "Vuelo",
  bus: "Autobús",
  car: "Coche",
  taxi: "Taxi",
  boat: "Barco",
  train: "Tren",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "Comida",
  transport: "Transporte",
  accommodation: "Alojamiento",
  activity: "Actividad",
  other: "Otro",
};

export const CURRENCIES = ["BRL", "EUR", "USD", "ARS", "COP", "MXN", "CLP"] as const;
export type Currency = (typeof CURRENCIES)[number];
