import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const middlewareAuthRefreshPaths = ["/meetings/"] as const;
const middlewareAuthRefreshExclusions = ["/meetings/new"] as const;

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export function shouldRefreshSessionInMiddleware(pathname: string) {
  if (middlewareAuthRefreshExclusions.includes(pathname as (typeof middlewareAuthRefreshExclusions)[number])) {
    return false;
  }

  return middlewareAuthRefreshPaths.some((path) => pathname.startsWith(path));
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey ||
    !hasSupabaseAuthCookie(request) ||
    !shouldRefreshSessionInMiddleware(request.nextUrl.pathname)
  ) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}
