export type ProfileUpdateInput = {
  nickname: string;
  avatarUrl: string;
};

export type ProfileUpdateResult =
  | { ok: true; value: ProfileUpdateInput }
  | { ok: false; message: string };

export function normalizeProfileUpdateInput(input: { nickname: string; avatarUrl: string }): ProfileUpdateResult {
  const nickname = input.nickname.trim();
  const avatarUrl = input.avatarUrl.trim();

  if (!nickname) {
    return { ok: false, message: "닉네임을 입력해 주세요." };
  }

  return { ok: true, value: { nickname, avatarUrl } };
}
