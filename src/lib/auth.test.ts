import assert from "node:assert/strict";
import test from "node:test";
import {
  profileFromPasswordUser,
  validatePasswordSignInInput,
  validatePasswordSignUpInput
} from "./auth";

test("validates password sign in input with trimmed email", () => {
  const result = validatePasswordSignInInput({
    email: "  user@example.com ",
    password: "secret123"
  });

  assert.deepEqual(result, {
    ok: true,
    email: "user@example.com",
    password: "secret123"
  });
});

test("rejects password sign up without nickname", () => {
  const result = validatePasswordSignUpInput({
    email: "user@example.com",
    password: "secret123",
    nickname: "   "
  });

  assert.deepEqual(result, {
    ok: false,
    message: "닉네임을 입력하세요."
  });
});

test("requires password sign up passwords to be at least 6 characters", () => {
  const result = validatePasswordSignUpInput({
    email: "user@example.com",
    password: "12345",
    nickname: "모이자"
  });

  assert.deepEqual(result, {
    ok: false,
    message: "비밀번호는 6자 이상 입력하세요."
  });
});

test("builds a minimal profile row for password users", () => {
  const profile = profileFromPasswordUser({
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    nickname: "모이자"
  });

  assert.deepEqual(profile, {
    id: "550e8400-e29b-41d4-a716-446655440000",
    kakao_id: "email:550e8400-e29b-41d4-a716-446655440000",
    nickname: "모이자",
    avatar_url: null
  });
});
