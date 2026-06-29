import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient, getSiteUrl } from "@/lib/supabase/server";
import { upsertOwnProfile } from "@/lib/supabase/profile";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  let next = requestUrl.searchParams.get("next") || "/";
  const origin = getSiteUrl(request.nextUrl.origin);

  if (!next.startsWith("/")) {
    next = "/";
  }

  if (!code && (!tokenHash || !type)) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          token_hash: tokenHash as string,
          type: type as EmailOtpType
        });

    if (error) {
      console.error("exchangeCodeForSession error:", error);

      return NextResponse.redirect(
        `${origin}/?auth_error=${encodeURIComponent(error.message)}`
      );
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(`${origin}/?auth_error=user_missing`);
    }

    const { error: profileError } = await upsertOwnProfile(supabase, user);

    if (profileError) {
      return NextResponse.redirect(`${origin}/?auth_error=profile_failed`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch {
    return NextResponse.redirect(`${origin}/?auth_error=supabase_env_missing`);
  }
}
