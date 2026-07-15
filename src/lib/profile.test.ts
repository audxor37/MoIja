import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProfileUpdateInput } from "./profile";

test("normalizes editable profile fields and requires nickname", () => {
  assert.deepEqual(normalizeProfileUpdateInput({ nickname: "  모이자  ", avatarUrl: "  https://example.com/a.png  " }), {
    ok: true,
    value: { nickname: "모이자", avatarUrl: "https://example.com/a.png" }
  });

  assert.deepEqual(normalizeProfileUpdateInput({ nickname: " ", avatarUrl: " " }), {
    ok: false,
    message: "닉네임을 입력해 주세요."
  });
});
