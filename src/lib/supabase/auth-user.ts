import type { SupabaseClient } from "@supabase/supabase-js";

type AuthClaims = {
  sub?: unknown;
};

export function getUserIdFromClaims(claims: AuthClaims | null | undefined) {
  return typeof claims?.sub === "string" && claims.sub.length > 0 ? claims.sub : null;
}

export async function getCurrentUserId(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    throw error;
  }

  return getUserIdFromClaims(data?.claims);
}
