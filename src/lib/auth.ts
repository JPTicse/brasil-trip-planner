import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
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

// Devuelve un cliente Supabase admin (service_role, bypasses RLS) y los datos
// del usuario autenticado. El cliente admin se usa para operaciones de BD en
// Server Actions porque el cliente anónimo con cookies no envía el JWT en
// las peticiones PostgREST desde Server Actions en Next.js 16.
// La autorización se verifica manualmente en cada acción (getCurrentUser +
// comprobación de rol/membresía).
export async function getAuthClient(): Promise<{
  supabase: SupabaseClient;
  user: {
    id: string;
    email: string;
    profile: Profile | null;
  } | null;
}> {
  // 1. Validar la sesión del usuario con el cliente de cookies (RLS)
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    const admin = createSupabaseAdminClient();
    return { supabase: admin, user: null };
  }

  // 2. Obtener el perfil usando el cliente admin
  const supabase = createSupabaseAdminClient();
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
