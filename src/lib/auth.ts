import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

// Devuelve el usuario autenticado y su perfil, o null si no hay sesión.
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  profile: Profile | null;
} | null> {
  const { user } = await getAuthClient();
  if (!user) return null;
  return user;
}

// Devuelve un cliente Supabase autenticado y los datos del usuario.
// Usa un único cliente para evitar perder el contexto de auth entre
// getCurrentUser() y las operaciones de BD en las Server Actions.
export async function getAuthClient(): Promise<{
  supabase: SupabaseClient;
  user: {
    id: string;
    email: string;
    profile: Profile | null;
  } | null;
}> {
  const supabase = await createSupabaseServerClient();

  // getSession() loads the session from cookies into the client's in-memory
  // state so that PostgREST requests include the JWT in the Authorization header.
  // getUser() alone validates the token but may not initialize the in-memory session.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // No session in cookies — try getUser() as a fallback (may refresh)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { supabase, user: null };
    // After getUser() refresh, try getSession() again
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.getSession();
    if (!refreshedSession) return { supabase, user: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    supabase,
    user: { id: user.id, email: user.email ?? "", profile },
  };
}
