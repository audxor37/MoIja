import assert from "node:assert/strict";
import test from "node:test";
import { shouldRefreshSessionInMiddleware } from "./middleware";

test("skips middleware auth refresh on dashboard and new meeting navigation", () => {
  assert.equal(shouldRefreshSessionInMiddleware("/"), false);
  assert.equal(shouldRefreshSessionInMiddleware("/meetings/new"), false);
});

test("keeps middleware auth refresh on existing meeting routes", () => {
  assert.equal(shouldRefreshSessionInMiddleware("/meetings/meeting-1/edit"), true);
});
