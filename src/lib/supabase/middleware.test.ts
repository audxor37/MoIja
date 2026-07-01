import assert from "node:assert/strict";
import test from "node:test";
import { shouldRefreshSessionInMiddleware } from "./middleware";

test("refreshes middleware auth on dashboard, team, and dashboard API routes", () => {
  assert.equal(shouldRefreshSessionInMiddleware("/"), true);
  assert.equal(shouldRefreshSessionInMiddleware("/team"), true);
  assert.equal(shouldRefreshSessionInMiddleware("/api/dashboard/session"), true);
});

test("skips middleware auth refresh on new meeting navigation", () => {
  assert.equal(shouldRefreshSessionInMiddleware("/meetings/new"), false);
});

test("keeps middleware auth refresh on existing meeting routes", () => {
  assert.equal(shouldRefreshSessionInMiddleware("/meetings/meeting-1/edit"), true);
});
