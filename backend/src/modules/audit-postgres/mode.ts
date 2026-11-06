// Der vorbereitete PostgreSQL-Pfad bleibt bis zur gesondert freigegebenen Umschaltung inaktiv.
export function getBusinessAuditMode(): "mongodb" | "postgresql" {
  const mode = process.env.BUSINESS_AUDIT_MODE ?? "mongodb";
  if (mode !== "mongodb" && mode !== "postgresql") throw new Error("Invalid business audit mode");
  return mode;
}
