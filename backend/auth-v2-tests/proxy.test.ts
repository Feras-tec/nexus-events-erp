import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { authV2Prisma } from "../src/modules/auth-v2/prisma.js";
import { createProxyServer } from "../src/modules/auth-v2/proxy.js";
import {
  BASE_PATH,
  OWNER_ID,
  PASSWORD,
  buildApp,
  resetDb,
  seedUser,
} from "./helpers.js";

const PUBLIC_ORIGIN = "https://app.nexus-proxy.test";
const PUBLIC_HOST = "app.nexus-proxy.test";

type RawResponse = {
  status: number;
  headers: http.IncomingHttpHeaders;
  setCookie: string[];
  body: string;
};

function rawRequest(
  port: number,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string | string[]>;
    body?: string;
  },
): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: "127.0.0.1",
        port,
        method: options.method,
        path: options.path,
        headers: options.headers,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          const rawCookie = response.headers["set-cookie"];
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            setCookie: Array.isArray(rawCookie)
              ? rawCookie
              : rawCookie
                ? [rawCookie]
                : [],
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    request.on("error", reject);
    if (options.body !== undefined) request.write(options.body);
    request.end();
  });
}

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve((server.address() as AddressInfo).port);
    });
  });
}

function close(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

function sessionCookie(setCookie: string[]): string {
  const line = setCookie.find((cookie) =>
    /(?:^|\s)(?:__Secure-)?nexus\.session_token=[^;\s]/.test(cookie),
  );
  assert.ok(line, `No session cookie in ${JSON.stringify(setCookie)}`);
  return line!.split(";")[0]!;
}

let echoServer: http.Server;
let echoProxy: http.Server;
let echoPort = 0;
let echoProxyPort = 0;

let upstreamServer: http.Server;
let authProxy: http.Server;
let upstreamPort = 0;
let proxyPort = 0;

before(async () => {
  await resetDb();
  await seedUser({
    id: OWNER_ID,
    email: "owner@spike.test",
    name: "Owner",
    role: "OWNER",
    clerkUserId: "clerk_legacy_owner",
  });

  echoServer = http.createServer((req, res) => {
    res.writeHead(200, {
      "content-type": "application/json",
      "set-cookie": [
        "echo_a=1; Path=/; HttpOnly",
        "echo_b=2; Path=/; SameSite=Lax",
      ],
      "x-upstream-hop": "kept",
    });
    res.end(
      JSON.stringify({
        headers: req.headers,
        method: req.method,
        url: req.url,
      }),
    );
  });
  echoPort = await listen(echoServer);
  echoProxy = createProxyServer({
    target: `http://127.0.0.1:${echoPort}`,
    forwardedProto: "https",
  });
  echoProxyPort = await listen(echoProxy);

  const upstream = buildApp({
    config: {
      baseURL: PUBLIC_ORIGIN,
      trustedOrigins: [PUBLIC_ORIGIN],
      secureCookies: true,
    },
  });
  upstreamServer = http.createServer(upstream.app);
  upstreamPort = await listen(upstreamServer);
  authProxy = createProxyServer({
    target: `http://127.0.0.1:${upstreamPort}`,
    forwardedProto: "https",
  });
  proxyPort = await listen(authProxy);
});

after(async () => {
  await Promise.all([
    close(authProxy),
    close(upstreamServer),
    close(echoProxy),
    close(echoServer),
  ]);
  await authV2Prisma.$disconnect();
});

test("PASS: the proxy forwards cookies, multiple Set-Cookie headers and trusted forwarding headers", async () => {
  const response = await rawRequest(echoProxyPort, {
    method: "GET",
    path: "/api/echo?x=1",
    headers: {
      host: PUBLIC_HOST,
      cookie: "client_cookie=abc123",
      "x-forwarded-for": "203.0.113.77",
    },
  });

  assert.equal(response.status, 200);
  const echoed = JSON.parse(response.body) as {
    headers: Record<string, string>;
  };
  const headers = echoed.headers;

  assert.equal(headers["cookie"], "client_cookie=abc123");
  assert.equal(headers["x-forwarded-proto"], "https");
  assert.equal(headers["x-forwarded-host"], PUBLIC_HOST);
  assert.equal(headers["x-forwarded-for"], "127.0.0.1");
  assert.equal(headers["x-real-ip"], "127.0.0.1");
  assert.ok(!headers["x-forwarded-for"]!.includes("203.0.113.77"));

  assert.equal(response.setCookie.length, 2);
  assert.ok(response.setCookie.some((cookie) => cookie.startsWith("echo_a=1")));
  assert.ok(response.setCookie.some((cookie) => cookie.startsWith("echo_b=2")));
  assert.equal(response.headers["x-upstream-hop"], "kept");
});

test("PASS: login through the same-origin proxy sets a host-only Secure HttpOnly cookie", async () => {
  const response = await rawRequest(proxyPort, {
    method: "POST",
    path: `${BASE_PATH}/sign-in/email`,
    headers: {
      host: PUBLIC_HOST,
      origin: PUBLIC_ORIGIN,
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.99",
    },
    body: JSON.stringify({
      email: "owner@spike.test",
      password: PASSWORD,
    }),
  });

  assert.equal(response.status, 200, response.body);
  const line = response.setCookie.find((cookie) =>
    /^__Secure-nexus\.session_token=/.test(cookie),
  );
  assert.ok(line, JSON.stringify(response.setCookie));
  assert.match(line!, /;\s*Secure/i);
  assert.match(line!, /HttpOnly/i);
  assert.match(line!, /SameSite=Lax/i);
  assert.match(line!, /Path=\//);
  assert.doesNotMatch(line!, /Domain=/i);

  const value = sessionCookie(response.setCookie);
  assert.match(value, /^__Secure-nexus\.session_token=[A-Za-z0-9]{32}\./);

  const stored = await authV2Prisma.session.findFirstOrThrow({
    where: { userId: OWNER_ID },
  });
  assert.match(stored.token, /^v1:[0-9a-f]{64}$/);
  assert.ok(!value.includes(stored.token));
});

test("PASS: authenticated requests traverse the proxy without leaking the token", async () => {
  const loginResponse = await rawRequest(proxyPort, {
    method: "POST",
    path: `${BASE_PATH}/sign-in/email`,
    headers: {
      host: PUBLIC_HOST,
      origin: PUBLIC_ORIGIN,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "owner@spike.test",
      password: PASSWORD,
    }),
  });
  const cookie = sessionCookie(loginResponse.setCookie);

  const me = await rawRequest(proxyPort, {
    method: "GET",
    path: `${BASE_PATH}/account/me`,
    headers: { host: PUBLIC_HOST, origin: PUBLIC_ORIGIN, cookie },
  });
  assert.equal(me.status, 200, me.body);
  assert.equal(
    (JSON.parse(me.body) as { user: { email: string } }).user.email,
    "owner@spike.test",
  );

  const unauthenticated = await rawRequest(proxyPort, {
    method: "GET",
    path: `${BASE_PATH}/admin/users`,
    headers: { host: PUBLIC_HOST, origin: PUBLIC_ORIGIN },
  });
  assert.equal(unauthenticated.status, 401);

  const session = await rawRequest(proxyPort, {
    method: "GET",
    path: `${BASE_PATH}/get-session`,
    headers: { host: PUBLIC_HOST, origin: PUBLIC_ORIGIN, cookie },
  });
  assert.equal(session.status, 200, session.body);
  assert.doesNotMatch(session.body, /"token"/);
  assert.doesNotMatch(session.body, /v1:[0-9a-f]{64}/);
});

test("PASS: cross-site and origin-less state changes are rejected through the proxy", async () => {
  const loginResponse = await rawRequest(proxyPort, {
    method: "POST",
    path: `${BASE_PATH}/sign-in/email`,
    headers: {
      host: PUBLIC_HOST,
      origin: PUBLIC_ORIGIN,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "owner@spike.test",
      password: PASSWORD,
    }),
  });
  const cookie = sessionCookie(loginResponse.setCookie);

  const evil = await rawRequest(proxyPort, {
    method: "POST",
    path: `${BASE_PATH}/revoke-sessions`,
    headers: {
      host: PUBLIC_HOST,
      origin: "https://evil.example",
      cookie,
    },
  });
  assert.equal(evil.status, 403, evil.body);

  const missingOrigin = await rawRequest(proxyPort, {
    method: "POST",
    path: `${BASE_PATH}/revoke-sessions`,
    headers: { host: PUBLIC_HOST, cookie },
  });
  assert.equal(missingOrigin.status, 403, missingOrigin.body);

  const stillValid = await rawRequest(proxyPort, {
    method: "GET",
    path: `${BASE_PATH}/account/me`,
    headers: { host: PUBLIC_HOST, origin: PUBLIC_ORIGIN, cookie },
  });
  assert.equal(stillValid.status, 200, stillValid.body);
});

test("PASS: logout through the proxy clears the cookie and invalidates the session", async () => {
  const loginResponse = await rawRequest(proxyPort, {
    method: "POST",
    path: `${BASE_PATH}/sign-in/email`,
    headers: {
      host: PUBLIC_HOST,
      origin: PUBLIC_ORIGIN,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "owner@spike.test",
      password: PASSWORD,
    }),
  });
  const cookie = sessionCookie(loginResponse.setCookie);

  const logout = await rawRequest(proxyPort, {
    method: "POST",
    path: `${BASE_PATH}/sign-out`,
    headers: {
      host: PUBLIC_HOST,
      origin: PUBLIC_ORIGIN,
      cookie,
      "content-type": "application/json",
    },
    body: "{}",
  });
  assert.equal(logout.status, 200, logout.body);

  const clearing = logout.setCookie.find((line) =>
    /(?:^|\s)(?:__Secure-)?nexus\.session_token=/.test(line),
  );
  assert.ok(clearing, JSON.stringify(logout.setCookie));
  assert.match(clearing!, /Max-Age=0/i);

  const afterLogout = await rawRequest(proxyPort, {
    method: "GET",
    path: `${BASE_PATH}/account/me`,
    headers: { host: PUBLIC_HOST, origin: PUBLIC_ORIGIN, cookie },
  });
  assert.equal(afterLogout.status, 401, afterLogout.body);
});

test("PASS: audit-log IPs come from the proxy hop, not a spoofed X-Forwarded-For", async () => {
  const loginResponse = await rawRequest(proxyPort, {
    method: "POST",
    path: `${BASE_PATH}/sign-in/email`,
    headers: {
      host: PUBLIC_HOST,
      origin: PUBLIC_ORIGIN,
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.200",
    },
    body: JSON.stringify({
      email: "owner@spike.test",
      password: PASSWORD,
    }),
  });
  assert.equal(loginResponse.status, 200, loginResponse.body);

  const events = await authV2Prisma.securityEvent.findMany({
    where: { eventType: "LOGIN_SUCCESS" },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  assert.equal(events[0]?.ip, "127.0.0.1");
  assert.notEqual(events[0]?.ip, "198.51.100.200");
});
