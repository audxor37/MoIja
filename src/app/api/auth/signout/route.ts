import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, getSiteUrl } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const origin = getSiteUrl(request.nextUrl.origin);

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    return NextResponse.redirect(`${origin}/?auth_error=supabase_env_missing`, 303);
  }

  return NextResponse.redirect(origin, 303);
}
