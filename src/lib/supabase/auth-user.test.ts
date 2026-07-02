import assert from "node:assert/strict";
import test from "node:test";
import { getUserIdFromClaims } from "./auth-user";

test("reads the current user id from verified auth claims", () => {
  assert.equal(getUserIdFromClaims({ sub: "user-1" }), "user-1");
});

test("returns null when auth claims do not contain a usable subject", () => {
  assert.equal(getUserIdFromClaims(null), null);
  assert.equal(getUserIdFromClaims({}), null);
  assert.equal(getUserIdFromClaims({ sub: "" }), null);
});
