"use server";

import { redirect } from "next/navigation";
import {
  profileFromPasswordUser,
  validatePasswordSignInInput,
  validatePasswordSignUpInput
} from "@/lib/auth";
import { createSupabaseServerClient, getSiteUrl } from "@/lib/supabase/server";
import { upsertOwnProfile } from "@/lib/supabase/profile";

function redirectWithPasswordMessage(message: string): never {
  redirect(`/auth/password?message=${encodeURIComponent(message)}`);
}

function redirectWithPasswordError(message: string, mode: "sign-in" | "sign-up" = "sign-in"): never {
  redirect(`/auth/password?mode=${mode}&error=${encodeURIComponent(message)}`);
}

export async function signInWithPassword(formData: FormData) {
  const input = validatePasswordSignInInput({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  });

  if (!input.ok) {
    redirectWithPasswordError(input.message);
  }

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirectWithPasswordError("Supabase 환경 변수가 아직 설정되지 않았습니다.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password
  });

  if (error || !data.user) {
    redirectWithPasswordError("이메일 또는 비밀번호를 확인하세요.");
  }

  const { error: profileError } = await upsertOwnProfile(supabase, data.user);

  if (profileError) {
    redirectWithPasswordError("로그인은 완료됐지만 프로필 저장에 실패했습니다.");
  }

  redirect("/");
}

export async function signUpWithPassword(formData: FormData) {
  const input = validatePasswordSignUpInput({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    nickname: String(formData.get("nickname") ?? "")
  });

  if (!input.ok) {
    redirectWithPasswordError(input.message, "sign-up");
  }

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirectWithPasswordError("Supabase 환경 변수가 아직 설정되지 않았습니다.", "sign-up");
  }

  const origin = getSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        nickname: input.nickname
      },
      emailRedirectTo: `${origin}/auth/callback`
    }
  });

  if (error || !data.user) {
    redirectWithPasswordError("회원가입에 실패했습니다. 입력 정보를 다시 확인하세요.", "sign-up");
  }

  if (!data.session) {
    redirectWithPasswordMessage("가입 확인 메일을 보냈습니다. 이메일 확인 후 로그인하세요.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profileFromPasswordUser({ id: data.user.id, email: input.email, nickname: input.nickname }), {
      onConflict: "id"
    });

  if (profileError) {
    redirectWithPasswordError("가입은 완료됐지만 프로필 저장에 실패했습니다.", "sign-up");
  }

  redirect("/");
}
