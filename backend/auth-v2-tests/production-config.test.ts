import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

// The production routing file is part of the deployment change set. The proxy
// test suite validates the prepared example; this test pins the real file so a
// later edit cannot silently break same-origin cookies or direct Auth-V2
// navigation.
type Rewrite = { source: string; destination: string };

const config = JSON.parse(
  await readFile(new URL("../../frontend/vercel.json", import.meta.url), "utf8"),
) as { rewrites: Rewrite[] };

test("production Vercel config proxies the API and serves both Auth-V2 HTML entries", () => {
  assert.deepEqual(
    config.rewrites.map((rule) => rule.source),
    ["/api/:path*", "/auth-v2", "/auth-v2/:path*", "/(.*)"],
  );
  assert.equal(
    config.rewrites[0]?.destination,
    "https://nexus-events-erp.onrender.com/api/:path*",
  );
  assert.equal(config.rewrites[1]?.destination, "/auth-v2.html");
  assert.equal(config.rewrites[2]?.destination, "/auth-v2.html");
  assert.equal(config.rewrites[3]?.destination, "/index.html");
});
