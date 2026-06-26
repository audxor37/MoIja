import assert from "node:assert/strict";
import test from "node:test";
import { resolveSiteUrl } from "./site-url";

test("uses the configured public site URL when it is real", () => {
  assert.equal(
    resolveSiteUrl({
      configuredSiteUrl: "https://moija.example.com/",
      requestOrigin: "https://mo-ija.vercel.app",
      vercelProjectProductionUrl: "mo-ija.vercel.app"
    }),
    "https://moija.example.com"
  );
});

test("ignores placeholder site URLs and uses the request origin", () => {
  assert.equal(
    resolveSiteUrl({
      configuredSiteUrl: "https://your-vercel-domain.vercel.app",
      requestOrigin: "https://moija.example.com",
      vercelProjectProductionUrl: "mo-ija.vercel.app"
    }),
    "https://moija.example.com"
  );
});

test("normalizes Vercel production URLs without prepending another host", () => {
  assert.equal(
    resolveSiteUrl({
      vercelProjectProductionUrl: "mo-ija.vercel.app"
    }),
    "https://mo-ija.vercel.app"
  );
});
