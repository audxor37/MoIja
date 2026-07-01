import { NextResponse } from "next/server";
import { getDashboardSession } from "@/lib/server/dashboard-data";
import { isMissingRefreshTokenError } from "@/lib/supabase/auth-error";

export async function GET() {
  try {
    const session = await getDashboardSession();
    return NextResponse.json(session);
  } catch (error) {
    if (!isMissingRefreshTokenError(error)) {
      throw error;
    }

    return NextResponse.json({ nickname: null, team: null });
  }
}
