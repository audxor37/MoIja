import { type SupabaseClient, type User } from "@supabase/supabase-js";

type ProfileRow = {
  id: string;
  kakao_id: string;
  nickname: string;
  avatar_url: string | null;
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function profileFromKakaoUser(user: User): ProfileRow {
  const kakaoIdentity = user.identities?.find((identity) => identity.provider === "kakao");
  const metadata = user.user_metadata ?? {};
  const kakaoId =
    readString(kakaoIdentity?.id) ||
    readString(metadata.provider_id) ||
    readString(metadata.sub) ||
    `email:${user.id}`;
  const nickname =
    readString(metadata.nickname) ||
    readString(metadata.name) ||
    readString(metadata.full_name) ||
    readString(user.email?.split("@")[0]) ||
    "MoIja member";
  const avatarUrl = readString(metadata.avatar_url) || readString(metadata.picture);

  return {
    id: user.id,
    kakao_id: kakaoId,
    nickname,
    avatar_url: avatarUrl
  };
}

export async function upsertOwnProfile(supabase: SupabaseClient, user: User) {
  return supabase.from("profiles").upsert(profileFromKakaoUser(user), { onConflict: "id" });
}
