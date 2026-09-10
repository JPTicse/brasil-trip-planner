import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function getRedirectTo(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("redirect") ?? "/trips";
}

export function signInWithGoogle() {
  const supabase = createSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(getRedirectTo())}`;
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}

export async function signOut() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  // Full reload to clear all server-side session state
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/login";
}
