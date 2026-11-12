// Legacy Jest suites in tests/ exercise the explicit Clerk fallback path and
// its provider-specific responses (e.g. "Unauthorized", Clerk getAuth calls).
// Auth-V2 has its own dedicated suite under auth-v2-tests/ (node:test runner).
//
// The application default is Auth-V2 (see src/auth/mode.ts). Selecting Clerk
// here is a test-harness decision only: it mirrors the pre-migration behaviour
// these suites were written for and must not change production defaults.
if (!process.env.AUTH_MODE && !process.env.AUTH_V2_ENABLED) {
  process.env.AUTH_MODE = "clerk";
}
