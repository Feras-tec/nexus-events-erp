// Kein Rückgriff auf allgemeine oder produktive Umgebungsvariablen; nur ausdrücklich lokale Testziele.
export function requireLocalAuditUrl(value: string | undefined, kind: "postgres" | "mongo"): string {
  if (!value) throw new Error("Explicit disposable audit database URL required");
  const url = new URL(value);
  const protocol = kind === "postgres" ? ["postgresql:", "postgres:"] : ["mongodb:"];
  if (!protocol.includes(url.protocol) || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
      !/^\/test_audit_2l(?:_[a-z0-9_]+)?$/.test(url.pathname) || url.search || url.hash || url.host.includes(",")) {
    throw new Error("Only an explicit loopback test_audit_2l database without URL options is permitted");
  }
  return value;
}
