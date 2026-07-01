import assert from "node:assert/strict";
import test from "node:test";
import { isMissingRefreshTokenError } from "./auth-error";

test("detects missing Supabase refresh token errors", () => {
  assert.equal(
    isMissingRefreshTokenError(new Error("Invalid Refresh Token: Refresh Token Not Found")),
    true
  );
  assert.equal(isMissingRefreshTokenError({ message: "Refresh Token Not Found" }), true);
});

test("detects missing Supabase auth session errors", () => {
  assert.equal(isMissingRefreshTokenError(new Error("Auth session missing!")), true);
  assert.equal(
    isMissingRefreshTokenError({
      name: "AuthSessionMissingError",
      message: "Auth session missing!"
    }),
    true
  );
});

test("does not classify unrelated auth errors as missing refresh token errors", () => {
  assert.equal(isMissingRefreshTokenError(new Error("Email not confirmed")), false);
  assert.equal(isMissingRefreshTokenError(null), false);
});
