# Auth-V2 primary mode — local operation and rollback

Phase 2I makes Auth-V2 the default when provider-selection variables are absent. This supersedes historical Phase 2D–2H instructions to keep it disabled. It does not authorize any remote rollout.

## Provider selection

| Backend | Frontend build | Result |
|---|---|---|
| No AUTH_MODE or legacy flag | No VITE_AUTH_MODE or legacy flag | Auth-V2 |
| AUTH_MODE=auth-v2 | VITE_AUTH_MODE=auth-v2 | Explicit Auth-V2 |
| AUTH_MODE=clerk | VITE_AUTH_MODE=clerk | Temporary Clerk rollback |
| AUTH_V2_ENABLED=false | VITE_AUTH_V2_ENABLED=false | Legacy explicit Clerk rollback alias |

Invalid values and conflicting new/legacy selections are errors. Do not select different providers on the two sides. A no-store `/api/auth/mode` handshake gates frontend authentication initialization; mismatch, unavailable backend, or non-JSON fallback blocks access. Provider mode is startup/build configuration, not a user-supplied identity. Restart/rebuild to switch modes.

Clerk is not initialized in normal Auth-V2 operation. The frontend loads its provider and account button lazily only for fallback; the backend mounts Clerk middleware and `/api/auth/me` only in fallback. In Auth-V2 mode `/api/auth/me` returns JSON404; use `/api/auth-v2/account/me`. A request's bearer token cannot select the other provider. In Clerk fallback, Auth-V2 cookies are ignored and Auth-V2 routes are not mounted.

## Local setup

Use a verified disposable PostgreSQL database only. `DATABASE_URL` and `AUTH_V2_DATABASE_URL` must identify the same logical application database/schema so the session and ERP AppUser lookups agree. `AUTH_V2_AUTH_SECRET` must be a dedicated random secret of at least32 characters. No default secret or database URL is supplied. Missing required configuration fails startup rather than falling back to Clerk.

Use `backend/.env.example` and `frontend/.env.example` as variable-name references, not credential sources. Default Backend port3210 matches the default Vite proxy. Bind local acceptance servers to loopback. For the standard Vite port5173, use a consistent `127.0.0.1` origin in base URL, app URL, trusted origins, CORS, and browser navigation. Do not mix localhost and127.0.0.1 cookie origins accidentally. Local HTTP alone permits non-Secure cookies; HTTPS staging must use Secure cookies.

The existing guarded runner can execute tests with explicit provider modes:

```bash
# backend/; requires the existing marked disposable cluster
node scripts/phase-2h4-local.mjs legacy
node scripts/phase-2h4-local.mjs auth
```

For browser acceptance on the existing disposable cluster:

```bash
# backend/ — synthetic local accounts only
node scripts/phase-2h5-local.mjs seed
# backend/ — unsets provider flags and Clerk keys to exercise the new default
node scripts/phase-2h5-local.mjs serve
# frontend/ — separate process, no provider-selection override
NEXUS_LOCAL_API_TARGET=http://127.0.0.1:3286 VITE_API_URL= npm run dev -- --host 127.0.0.1 --port 5186 --strictPort
```

Unset inherited `VITE_AUTH_MODE` and `VITE_AUTH_V2_ENABLED` if they explicitly select an older rollback mode. Existing actual `.env` files are not overwritten by Phase 2I. Never print credentials or run database-reset suites while preserving a live acceptance session.

## Prepared hosting routing

`frontend/vercel.auth-v2.example.json` is prepared only and is not the active hosting configuration. Order: all `/api/:path*` traffic to the separately approved isolated backend, Auth-V2 HTML routes, then ERP SPA fallback. Replace its deliberately invalid placeholder only after approval. Preserve static assets, method/body/query, Origin, Cookie, multiple Set-Cookie, and JSON error statuses. Local tests emulate the rule order; real Vercel/Render forwarding and HTTPS semantics still need approved staging verification. `frontend/vercel.json` is unchanged.

No API request may silently become successful SPA HTML. The Backend now returns JSON404 for unknown API routes and private/no-store headers for API responses. The public mode handshake carries no identity or secrets and remains behind IP abuse protection.

## Existing Clerk account migration

No production users have been inspected. Disposable tests verify that existing AppUser IDs, Clerk IDs, roles and activation state can survive local-password authentication. This is not evidence about production data readiness.

Before any approved migration, create a sanitized inventory of stable AppUser IDs, verified email ownership, duplicate/case-variant addresses, activation state, role, Clerk linkage, credential presence, and MFA policy. Do not infer ownership merely because two records have the same normalized email. Review each collision and missing email manually; preserve the stable AppUser row. Never auto-merge, auto-promote, activate, or overwrite accounts.

Clerk passwords, session tokens and MFA factors are not imported. Existing Clerk-only users need a reviewed invitation/password-setup procedure tied to verified identity and the same AppUser ID. The current invitation-only flow can reject pre-existing users; do not assume it automatically provisions credentials on their existing row. A dedicated approved recovery/provisioning procedure must be rehearsed before real-user cutover. Do not call generic create-account flows as a workaround that duplicates AppUser records. Retain recovery for the last active OWNER and test overdue-MFA enrollment recovery.

Review unique-email migration preconditions and schema history on sanitized disposable data. No production migration, account linking, creation, deletion, merge, credential reset or role change is authorized by this document.

## Temporary Clerk rollback

Set AUTH_MODE=clerk on the backend and build the frontend with VITE_AUTH_MODE=clerk. Remove contradictory legacy flags or align them to false. Supply authorized nonproduction Clerk settings for testing, restart both components, and verify the handshake. Do not remove Clerk dependencies or the expanded schema. A frontend-only or backend-only rollback fails the mode handshake.

Keep an expanded-schema-compatible rollback artifact: Auth-V2 users may have null Clerk IDs, and an old generated client expecting non-null IDs is not a safe automatic rollback. Do not drop auth tables, mutate existing accounts, or rotate the signing/encryption secret blindly. Disabling endpoints does not revoke stored sessions; decide controlled staging-session invalidation separately.

## Remaining operational gates

Quotas remain finite, with independent per-account and per-IP layers. Auth-V2 IDs are derived only from validated server sessions; invalid/revoked/expired sessions get anonymous IP budgets. Stores remain process-local; approve a one-instance limitation or implement/test a shared store before multi-instance rollout. Confirm proxy topology rather than blindly trusting all headers. Rehearse secure cookies, allowed/rejected origins, account provisioning, audit delivery, MFA recovery, and coordinated rollback on approved staging before deployment.
