import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Devuelve el usuario autenticado y su perfil, o null si no hay sesión.
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  profile: Profile | null;
} | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { id: user.id, email: user.email ?? "", profile };
}
