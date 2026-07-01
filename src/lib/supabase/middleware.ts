import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isMissingRefreshTokenError } from "@/lib/supabase/auth-error";

const middlewareAuthRefreshExactPaths = ["/", "/team", "/api/dashboard/session"] as const;
const middlewareAuthRefreshPaths = ["/meetings/"] as const;
const middlewareAuthRefreshExclusions = ["/meetings/new"] as const;

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export function shouldRefreshSessionInMiddleware(pathname: string) {
  if (middlewareAuthRefreshExclusions.includes(pathname as (typeof middlewareAuthRefreshExclusions)[number])) {
    return false;
  }

  if (middlewareAuthRefreshExactPaths.includes(pathname as (typeof middlewareAuthRefreshExactPaths)[number])) {
    return true;
  }

  return middlewareAuthRefreshPaths.some((path) => pathname.startsWith(path));
}

function expireSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter(({ name }) => name.startsWith("sb-") && name.includes("auth-token"))
    .forEach(({ name }) => {
      request.cookies.delete(name);
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    });
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

  try {
    const { error } = await supabase.auth.getUser();

    if (error && isMissingRefreshTokenError(error)) {
      expireSupabaseAuthCookies(request, response);
    }
  } catch (error) {
    if (!isMissingRefreshTokenError(error)) {
      throw error;
    }

    expireSupabaseAuthCookies(request, response);
  }

  return response;
}
