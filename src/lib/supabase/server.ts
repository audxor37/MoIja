import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveSiteUrl } from "@/lib/site-url";

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { supabaseUrl, supabaseKey };
}

export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Server Components cannot set cookies; middleware refreshes them.
          }
        });
      }
    }
  });
}

export function getSiteUrl(requestOrigin?: string) {
  return resolveSiteUrl({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    requestOrigin,
    vercelProjectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL
  });
}
