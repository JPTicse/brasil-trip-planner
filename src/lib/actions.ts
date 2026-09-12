"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, getAuthClient } from "@/lib/auth";
import { getTripMembers, isTripMember, isTripOwner } from "@/lib/data";
import type { Inspiration } from "@/lib/types";

// --- Viajes ---

export async function createTrip(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const name = formData.get("name") as string;
  const country = (formData.get("country") as string) || null;
  const city = (formData.get("city") as string) || null;
  const destination = city && country ? `${city}, ${country}` : city ?? country ?? null;
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;
  const description = (formData.get("description") as string) || null;

  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      name,
      destination,
      country,
      city,
      start_date: startDate,
      end_date: endDate,
      description,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Error al crear viaje: ${error.message}`);

  // Añadir al creador como owner
  await supabase
    .from("trip_members")
    .insert({ trip_id: trip.id, user_id: user.id, role: "owner" });

  revalidatePath("/trips");
  redirect(`/trips/${trip.id}`);
}


export async function updateTrip(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;
  const owner = await isTripOwner(tripId, user.id);
  if (!owner) throw new Error("Solo el creador puede editar el viaje");

  const name = formData.get("name") as string;
  const country = (formData.get("country") as string) || null;
  const city = (formData.get("city") as string) || null;
  const destination = city && country ? `${city}, ${country}` : city ?? country ?? null;
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;
  const description = (formData.get("description") as string) || null;

  const { error } = await supabase
    .from("trips")
    .update({
      name,
      destination,
      country,
      city,
      start_date: startDate,
      end_date: endDate,
      description,
    })
    .eq("id", tripId);

  if (error) throw new Error(`Error al actualizar viaje: ${error.message}`);

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/itinerary`);
}
// --- Solicitudes de acceso ---

export async function requestTripAccess(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;
  const message = (formData.get("message") as string) || null;

  // Verificar que no es ya miembro
  const member = await isTripMember(tripId, user.id);
  if (member) throw new Error("Ya eres miembro de este viaje");

  const { error } = await supabase
    .from("trip_access_requests")
    .upsert(
      { trip_id: tripId, user_id: user.id, message, status: "pending" },
      { onConflict: "trip_id,user_id" },
    );

  if (error) throw new Error(`Error al solicitar acceso: ${error.message}`);

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
}

export async function resolveAccessRequest(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const requestId = formData.get("request_id") as string;
  const tripId = formData.get("trip_id") as string;
  const action = formData.get("action") as string; // "approve" | "reject"

  const owner = await isTripOwner(tripId, user.id);
  if (!owner) throw new Error("Solo el creador puede gestionar solicitudes");

  const status = action === "approve" ? "approved" : "rejected";

  const { error } = await supabase
    .from("trip_access_requests")
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("id", requestId);

  if (error) throw new Error(`Error al procesar solicitud: ${error.message}`);

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/members`);
}

export async function deleteTrip(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;

  const owner = await isTripOwner(tripId, user.id);
  if (!owner) throw new Error("Solo el creador puede eliminar el viaje");

  await supabase.from("trips").delete().eq("id", tripId);
  revalidatePath("/trips");
  redirect("/trips");
}

export async function addTripMember(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;
  const email = (formData.get("email") as string).trim().toLowerCase();

  const owner = await isTripOwner(tripId, user.id);
  if (!owner) throw new Error("Solo el creador puede añadir miembros");

  // Buscar el usuario por email en profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("name", `%${email}%`)
    .limit(1)
    .single();

  // Si no se encuentra por nombre, intentar por auth.users vía RPC no disponible;
  // en su lugar buscamos por el email en los metadatos.
  let userId = profile?.id;

  if (!userId) {
    // Buscar en auth.users mediante el admin no disponible en cliente anónimo.
    // Alternativa: buscar perfil cuyo nombre contenga el email.
    const { data: p2 } = await supabase
      .from("profiles")
      .select("id, name")
      .ilike("name", `%${email.split("@")[0]}%`)
      .limit(1)
      .single();
    userId = p2?.id;
  }

  if (!userId) throw new Error("Usuario no encontrado. Pídele que se registre primero con su Google.");

  const { error } = await supabase
    .from("trip_members")
    .upsert({ trip_id: tripId, user_id: userId, role: "member" }, { onConflict: "trip_id,user_id" });

  if (error) throw new Error(`Error al añadir miembro: ${error.message}`);

  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/members`);
}

export async function removeTripMember(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;
  const memberId = formData.get("member_id") as string;

  const owner = await isTripOwner(tripId, user.id);
  if (!owner && memberId !== user.id)
    throw new Error("Solo el creador puede eliminar miembros");

  await supabase.from("trip_members").delete().eq("id", memberId);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/members`);
}

// --- Actividades ---

export async function createActivity(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  const { error } = await supabase
    .from("activities")
    .insert({
      trip_id: tripId,
      date: formData.get("date") as string,
      start_time: (formData.get("start_time") as string) || null,
      end_time: (formData.get("end_time") as string) || null,
      title: formData.get("title") as string,
      type: (formData.get("type") as string) || "visit",
      location: (formData.get("location") as string) || null,
      location_lat: formData.get("location_lat") ? Number(formData.get("location_lat")) : null,
      location_lng: formData.get("location_lng") ? Number(formData.get("location_lng")) : null,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      currency: (formData.get("currency") as string) || "BRL",
      notes: (formData.get("notes") as string) || null,
      image_url: (formData.get("image_url") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Error al crear actividad: ${error.message}`);

  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}/itinerary-v2`);
}

export async function deleteActivity(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const activityId = formData.get("activity_id") as string;
  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  await supabase.from("activities").delete().eq("id", activityId);
  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}/itinerary-v2`);
}

export async function updateActivity(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const activityId = formData.get("activity_id") as string;
  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  const { error } = await supabase
    .from("activities")
    .update({
      title: formData.get("title") as string,
      date: formData.get("date") as string,
      start_time: (formData.get("start_time") as string) || null,
      end_time: (formData.get("end_time") as string) || null,
      type: (formData.get("type") as string) || "visit",
      location: (formData.get("location") as string) || null,
      location_lat: formData.get("location_lat") ? Number(formData.get("location_lat")) : null,
      location_lng: formData.get("location_lng") ? Number(formData.get("location_lng")) : null,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      currency: (formData.get("currency") as string) || "BRL",
      notes: (formData.get("notes") as string) || null,
      image_url: (formData.get("image_url") as string) || null,
    })
    .eq("id", activityId);

  if (error) throw new Error("Error al actualizar actividad");
  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}/itinerary-v2`);
}

export async function joinActivity(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const activityId = formData.get("activity_id") as string;
  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  const { error } = await supabase
    .from("activity_participants")
    .insert({ activity_id: activityId, user_id: user.id });

  if (error && error.code !== "23505") {
    throw new Error(`Error al unirse: ${error.message}`);
  }

  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}/itinerary-v2`);
}

export async function leaveActivity(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const activityId = formData.get("activity_id") as string;
  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  await supabase
    .from("activity_participants")
    .delete()
    .eq("activity_id", activityId)
    .eq("user_id", user.id);

  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}/itinerary-v2`);
}

// --- Inspiraciones ---

export async function saveInspirations(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;
  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  const rawPlaces = formData.get("places") as string;
  let places: Inspiration[] = [];
  try {
    places = JSON.parse(rawPlaces) as Inspiration[];
  } catch {
    throw new Error("Datos de inspiraciones inválidos");
  }

  if (places.length === 0) {
    throw new Error("No se recibieron inspiraciones para guardar");
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const rows = places.map((p) => ({
    trip_id: tripId,
    place_id: p.place_id,
    title: p.title,
    address: p.address,
    image_url: p.image_url,
    image_urls: p.image_urls ?? [],
    description: p.description ?? null,
    viral_trend: p.viral_trend ?? null,
    category: p.category ?? null,
    emoji: p.emoji ?? null,
    photo_concepts: p.photo_concepts ?? [],
    instagram_score: p.instagram_score ?? null,
    difficulty: p.difficulty ?? null,
    best_time: p.best_time ?? null,
    opening_hours: p.opening_hours ?? null,
    website: p.website ?? null,
    user_ratings_total: p.user_ratings_total ?? null,
    rating: p.rating,
    price_level: p.price_level,
    types: p.types,
    suggested_type: p.suggested_type,
    location: p.address,
    lat: p.lat,
    lng: p.lng,
    cost_estimate: p.cost_estimate,
    currency: p.currency,
    expires_at: expiresAt,
  }));

  const { error: upsertError } = await supabase
    .from("inspirations")
    .upsert(rows, { onConflict: "trip_id,place_id" })
    .select();

  if (upsertError) {
    console.error("No se pudo guardar inspiraciones:", upsertError.message);
    throw new Error("No se pudieron guardar las inspiraciones: " + upsertError.message);
  }

  revalidatePath(`/trips/${tripId}/itinerary-v2`);
}

// --- Alojamientos ---

export async function createAccommodation(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  const { error } = await supabase
    .from("accommodations")
    .insert({
      trip_id: tripId,
      name: formData.get("name") as string,
      address: (formData.get("address") as string) || null,
      check_in: (formData.get("check_in") as string) || null,
      check_out: (formData.get("check_out") as string) || null,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      currency: (formData.get("currency") as string) || "BRL",
      booking_url: (formData.get("booking_url") as string) || null,
      booked_by: (formData.get("booked_by") as string) || null,
      notes: (formData.get("notes") as string) || null,
    });

  if (error) throw new Error(`Error al crear alojamiento: ${error.message}`);
  revalidatePath(`/trips/${tripId}/accommodations`);
}

export async function deleteAccommodation(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const accId = formData.get("accommodation_id") as string;
  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  await supabase.from("accommodations").delete().eq("id", accId);
  revalidatePath(`/trips/${tripId}/accommodations`);
}

// --- Transporte ---

export async function createTransport(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  const departure = formData.get("departure_at") as string;
  const arrival = formData.get("arrival_at") as string;

  const { error } = await supabase.from("transports").insert({
    trip_id: tripId,
    type: (formData.get("type") as string) || "flight",
    from_location: (formData.get("from_location") as string) || null,
    to_location: (formData.get("to_location") as string) || null,
    departure_at: departure ? new Date(departure).toISOString() : null,
    arrival_at: arrival ? new Date(arrival).toISOString() : null,
    cost: formData.get("cost") ? Number(formData.get("cost")) : null,
    currency: (formData.get("currency") as string) || "BRL",
    booking_url: (formData.get("booking_url") as string) || null,
    booked_by: (formData.get("booked_by") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) throw new Error(`Error al crear transporte: ${error.message}`);
  revalidatePath(`/trips/${tripId}/transport`);
}

export async function deleteTransport(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const transportId = formData.get("transport_id") as string;
  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  await supabase.from("transports").delete().eq("id", transportId);
  revalidatePath(`/trips/${tripId}/transport`);
}

// --- Gastos ---

export async function createExpense(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const tripId = formData.get("trip_id") as string;
  const amount = Number(formData.get("amount"));
  const paidBy = (formData.get("paid_by") as string) || user.id;
  const splitMode = (formData.get("split_mode") as string) || "equal";

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  // Crear el gasto
  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      trip_id: tripId,
      description: formData.get("description") as string,
      amount,
      currency: (formData.get("currency") as string) || "BRL",
      paid_by: paidBy,
      date: (formData.get("date") as string) || new Date().toISOString().slice(0, 10),
      category: (formData.get("category") as string) || "other",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Error al crear gasto: ${error.message}`);

  // Obtener miembros del viaje
  const members = await getTripMembers(tripId);
  const allMemberIds = members.map((m) => m.user_id);

  // Determinar qué miembros participan en el gasto
  const participantsRaw = formData.get("participants") as string;
  let participantIds: string[];
  if (participantsRaw) {
    participantIds = participantsRaw.split(",").filter((id) => allMemberIds.includes(id));
  } else {
    // Por defecto, todos
    participantIds = allMemberIds;
  }

  // El que paga siempre debe estar incluido como participante
  if (!participantIds.includes(paidBy)) {
    participantIds.push(paidBy);
  }

  if (participantIds.length < 2) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    throw new Error("Un gasto compartido necesita al menos 2 participantes");
  }

  if (splitMode === "equal") {
    const splitAmount = Math.round((amount / participantIds.length) * 100) / 100;
    const splits = participantIds.map((userId, i) => ({
      expense_id: expense.id,
      user_id: userId,
      // El último absorbe el redondeo
      amount: i === participantIds.length - 1
        ? Math.round((amount - splitAmount * (participantIds.length - 1)) * 100) / 100
        : splitAmount,
      settled: userId === paidBy,
    }));
    const { error: splitError } = await supabase
      .from("expense_splits")
      .insert(splits);
    if (splitError) throw new Error(`Error al repartir gasto: ${splitError.message}`);
  } else if (splitMode === "custom") {
    // Reparto personalizado: solo para los participantes seleccionados
    const splits = participantIds.map((userId) => {
      const raw = formData.get(`split_${userId}`) as string;
      const splitAmount = raw ? Math.round(Number(raw) * 100) / 100 : 0;
      return {
        expense_id: expense.id,
        user_id: userId,
        amount: splitAmount,
        settled: userId === paidBy,
      };
    });

    // Validar que la suma de los splits coincida con el monto total
    const sumSplits = splits.reduce((s, sp) => s + sp.amount, 0);
    if (Math.abs(sumSplits - amount) > 0.01) {
      // Eliminar el gasto si los splits no cuadran
      await supabase.from("expenses").delete().eq("id", expense.id);
      throw new Error(
        `La suma de las partes (${sumSplits.toFixed(2)}) no coincide con el total (${amount.toFixed(2)})`,
      );
    }

    const { error: splitError } = await supabase
      .from("expense_splits")
      .insert(splits);
    if (splitError) throw new Error(`Error al repartir gasto: ${splitError.message}`);
  }

  revalidatePath(`/trips/${tripId}/expenses`);
}

export async function deleteExpense(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const expenseId = formData.get("expense_id") as string;
  const tripId = formData.get("trip_id") as string;

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  // Solo quien pagó el gasto puede eliminarlo
  const { data: expense } = await supabase
    .from("expenses")
    .select("paid_by")
    .eq("id", expenseId)
    .single();

  if (expense?.paid_by !== user.id)
    throw new Error("Solo quien pagó el gasto puede eliminarlo");

  await supabase.from("expenses").delete().eq("id", expenseId);
  revalidatePath(`/trips/${tripId}/expenses`);
}

export async function toggleSplitSettled(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error("No autenticado");

  const splitId = formData.get("split_id") as string;
  const tripId = formData.get("trip_id") as string;
  const settled = formData.get("settled") === "true";

  const member = await isTripMember(tripId, user.id);
  if (!member) throw new Error("No tienes acceso a este viaje");

  // Solo quien pagó el gasto puede marcar splits como saldados
  const { data: split } = await supabase
    .from("expense_splits")
    .select("expense_id")
    .eq("id", splitId)
    .single();

  if (!split) throw new Error("Reparto no encontrado");

  const { data: expense } = await supabase
    .from("expenses")
    .select("paid_by")
    .eq("id", split.expense_id)
    .single();

  if (expense?.paid_by !== user.id)
    throw new Error("Solo quien pagó el gasto puede marcar pagos");

  await supabase.from("expense_splits").update({ settled: !settled }).eq("id", splitId);
  revalidatePath(`/trips/${tripId}/expenses`);
}

// --- Ubicación del usuario ---

export async function updateMyLocation(formData: FormData) {
  const { supabase, user } = await getAuthClient();
  if (!user) throw new Error('No autenticado');

  const lat = Number(formData.get('lat'));
  const lng = Number(formData.get('lng'));

  if (isNaN(lat) || isNaN(lng)) throw new Error('Coordenadas invalidas');

  const { error } = await supabase
    .from('profiles')
    .update({
      location_lat: lat,
      location_lng: lng,
      location_updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw new Error('Error al actualizar ubicacion');
}
