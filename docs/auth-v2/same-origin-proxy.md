> Phase 2I supersession: the historical auth-only trial below is not the current primary-mode runbook. Auth-V2 now defaults on, all ERP APIs require same-origin proxy coverage, and Clerk is an explicit fallback. Use `docs/auth-v2/primary-mode.md` and the final Phase 2I report; do not copy the old single-hop, auth-only rewrite, or feature-default instructions below.

# Auth-v2 Same-Origin Proxy (Vercel → Render)

Status: **PREPARED, NOT ACTIVATED**
Date: 2026-11-05
Owner: Phase 2D

> This document and the example config are planning artifacts. Nothing here is
> wired into the running application. `frontend/vercel.json` is unchanged and
> the auth-v2 router is not mounted by `backend/src/app.ts`. Do not merge the
> example config or set the auth-v2 environment variables until the separate
> approval gate described in the Phase 2D report has been passed.

## Why a same-origin proxy

Auth-v2 uses a signed, `HttpOnly`, `SameSite=Lax`, host-only session cookie
(`nexus.session_token`, or `__Secure-nexus.session_token` in secure mode). The
cookie belongs to the backend host. If the SPA is served from
`https://app.example.com` and the API from `https://api.example.com`, the cookie
is third-party:

- Safari ITP and other browsers block or partition it.
- `SameSite=Lax` cookies are not sent on cross-site `fetch`.
- The frontend's current `apiFetch` does not use `credentials: "include"`, and
  the current backend CORS config does not send
  `Access-Control-Allow-Credentials`.

Serving the auth endpoints under the same origin as the SPA (via a Vercel
rewrite) keeps the cookie first-party and avoids third-party-cookie behaviour
entirely. This mirrors the topology already validated by
`backend/auth-v2-tests/proxy.test.ts`.

## Target topology

```
Browser  ──https──▶  Vercel (app.example.com)
                         │  /api/auth-v2/*  rewrite
                         ▼
                     Render (nexus-api.onrender.com)
                         │  better-auth + Express auth-v2 router
                         ▼
                     PostgreSQL
```

- The SPA keeps its existing origin and SPA fallback.
- Only `/api/auth-v2/*` is delegated to Render.
- The existing Clerk-backed `/api/*` routes continue to be called exactly as
  they are today until the cutover is separately approved.

## Example Vercel configuration (NOT ACTIVE)

A ready-to-copy example lives at
`frontend/vercel.auth-v2.example.json`. It is named `.example.json` on purpose
so Vercel ignores it.

The rewrite must be ordered **before** the SPA fallback, otherwise the
`/(.*)` → `/index.html` rule would serve the SPA for auth requests.

```json
{
  "rewrites": [
    {
      "source": "/api/auth-v2/:path*",
      "destination": "https://nexus-api.onrender.com/api/auth-v2/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Notes:

- Replace `nexus-api.onrender.com` with the real Render service hostname.
- Do **not** proxy the whole of `/api/*` in the first step. Proxying only
  `/api/auth-v2/*` allows a side-by-side trial without touching Clerk traffic.
- Vercel preserves request headers and forwards `Set-Cookie` responses. The
  backend must be configured to trust exactly one proxy hop for client IP and
  protocol.
- A custom domain or preview deployment must be added to
  `AUTH_V2_TRUSTED_ORIGINS`; otherwise `POST` requests are rejected with
  `403 INVALID_ORIGIN`.

## Example Render environment (NOT ACTIVE)

Set these only on the Render service after approval. Values are illustrative.

```dotenv
AUTH_V2_ENABLED=false                # keep false until the enable step
AUTH_V2_BASE_URL=https://app.example.com
AUTH_V2_TRUSTED_ORIGINS=https://app.example.com
AUTH_V2_SECURE_COOKIES=true
AUTH_V2_AUTH_SECRET=<at-least-32-random-characters>
AUTH_V2_DATABASE_URL=<dedicated auth-v2 connection string>
AUTH_V2_EMAIL_DELIVERY_ENABLED=false # true only when Resend is configured
```

`AUTH_V2_AUTH_SECRET` must be generated with a CSPRNG, for example:

```bash
openssl rand -base64 48
```

Never reuse `CLERK_SECRET_KEY`, `DATABASE_URL`, `DIRECT_URL`, `MONGODB_URI` or
`RESEND_API_KEY` values that were previously exposed. Rotation is a hard
prerequisite for any production step.

## Application prerequisites before the rewrite is enabled

1. **Mount the router explicitly.** `backend/src/app.ts` does not import
   auth-v2. It must mount `createAuthV2Router()` under `/api/auth-v2` after
   `AUTH_V2_ENABLED=true` is validated.
2. **Trust exactly one proxy hop.** Add `app.set("trust proxy", 1)` (or the
   value matching the Vercel→Render topology) so `req.ip`, `X-Forwarded-Proto`
   and secure cookies behave correctly. The tests already run with
   `trust proxy = 1`.
3. **Do not mount global JSON parsing for auth-v2.** The auth-v2 router applies
   its own `express.json()` to custom routes and lets `toNodeHandler` read the
   raw stream for better-auth routes. Mounting it after the global
   `express.json()` is acceptable only because `better-call` re-serialises
   `req.body`; verify this on the real deployment.
4. **Health endpoint.** `GET /api/auth-v2/health` is unauthenticated and safe to
   probe from Render/Vercel monitors.

## Verification checklist (after deployment, before cutover)

- [ ] `GET https://app.example.com/api/auth-v2/health` returns
      `{"status":"ready","module":"auth-v2"}`.
- [ ] `POST /api/auth-v2/sign-in/email` with a seeded test account returns 200
      and sets `__Secure-nexus.session_token` with `HttpOnly`, `Secure`,
      `SameSite=Lax`, `Path=/`, and no `Domain`.
- [ ] The JSON body of sign-in, `get-session`, `list-sessions` and
      `change-password` contains no `token` field.
- [ ] `POST` with a foreign `Origin` returns `403 INVALID_ORIGIN`.
- [ ] `POST` without `Origin` returns `403 INVALID_ORIGIN`.
- [ ] Session revocation by ID invalidates the target session and keeps the
      current one.
- [ ] Audit events record the proxy hop IP, not a spoofed `X-Forwarded-For`.
- [ ] Real Safari (desktop and iOS) can sign in and refresh without a
      third-party-cookie prompt.
- [ ] Existing Clerk endpoints under `/api/*` still behave exactly as before.

## Rollback

1. Set `AUTH_V2_ENABLED=false` (the module refuses to start otherwise).
2. Remove or disable the `/api/auth-v2/*` rewrite; restore the previous
   `frontend/vercel.json`.
3. Revert the `app.set("trust proxy", …)` and router-mount changes if they were
   applied.
4. No database rollback is required for a disabled module; the additive
   migration leaves Clerk columns and rows intact. Do not drop tables as part
   of a rollback.

## What is intentionally not done here

- No edit to `frontend/vercel.json`.
- No Render service creation.
- No DNS or custom-domain change.
- No environment variable set on Vercel or Render.
- No router mount in `backend/src/app.ts`.
- No production migration.
