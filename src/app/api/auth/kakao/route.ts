import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getSiteUrl } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const origin = getSiteUrl(request.nextUrl.origin);

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${origin}/auth/callback`
      }
    });

    if (error || !data.url) {
      return NextResponse.redirect(`${origin}/?auth_error=kakao_start_failed`);
    }

    return NextResponse.redirect(data.url);
  } catch {
    return NextResponse.redirect(`${origin}/?auth_error=supabase_env_missing`);
  }
}
