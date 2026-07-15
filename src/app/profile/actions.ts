"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeProfileUpdateInput } from "@/lib/profile";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const result = await performUpdateProfile(formData);
  const suffix = result.ok ? "profile_message=updated" : `profile_error=${result.code}`;
  redirect(`/profile/edit?${suffix}`);
}

export async function performUpdateProfile(formData: FormData): Promise<
  | { ok: true }
  | { ok: false; code: "auth" | "invalid" | "save"; message: string }
> {
  const parsed = normalizeProfileUpdateInput({
    nickname: String(formData.get("nickname") ?? ""),
    avatarUrl: String(formData.get("avatarUrl") ?? "")
  });

  if (!parsed.ok) {
    return { ok: false, code: "invalid", message: parsed.message };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nickname: parsed.value.nickname,
      avatar_url: parsed.value.avatarUrl || null
    })
    .eq("id", userId);

  if (error) {
    return { ok: false, code: "save", message: "프로필 저장에 실패했습니다." };
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return { ok: true };
}
