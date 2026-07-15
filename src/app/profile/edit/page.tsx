import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { updateProfile } from "@/app/profile/actions";
import { AppShell, ScreenCard, TopBar } from "@/components/app-shell";
import { SubmitButton } from "@/components/pending-ui";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage({
  searchParams
}: {
  searchParams: Promise<{ profile_message?: string; profile_error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    redirect("/?meeting_error=auth_required");
  }

  const { data } = await supabase
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  const profile = data as { nickname: string | null; avatar_url: string | null } | null;

  return (
    <AppShell activePath="/profile">
      <TopBar title="프로필 편집" backHref="/profile" />
      <section className="grid gap-4 py-5 lg:py-7">
        <ScreenCard>
          <ShieldCheck className="text-lime" size={24} />
          <h1 className="mt-4 text-2xl font-black text-white">프로필 편집</h1>
          {params.profile_message === "updated" ? (
            <p className="mt-3 rounded-xl bg-[#183729] px-3 py-2 text-sm font-bold text-lime">저장되었습니다.</p>
          ) : null}
          {params.profile_error ? (
            <p className="mt-3 rounded-xl bg-[#3A1720] px-3 py-2 text-sm font-bold text-danger">저장하지 못했습니다.</p>
          ) : null}
          <form action={updateProfile} className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-sm font-bold text-appText">
              닉네임
              <input className="field-input" defaultValue={profile?.nickname ?? ""} name="nickname" />
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-appText">
              프로필 이미지 URL
              <input className="field-input" defaultValue={profile?.avatar_url ?? ""} name="avatarUrl" />
            </label>
            <SubmitButton
              className="inline-flex h-12 items-center justify-center rounded-xl bg-lime px-5 text-sm font-black text-app"
              pendingLabel="저장 중"
            >
              저장
            </SubmitButton>
          </form>
        </ScreenCard>
      </section>
    </AppShell>
  );
}
