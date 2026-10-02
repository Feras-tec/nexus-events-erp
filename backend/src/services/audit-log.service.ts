import mongoose from "mongoose";
import { AuditLog } from "../models/audit-log.model.js";

type AuditLogInput = {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: unknown;
  ipAddress?: string;
};

// Audit-Log speichern, ohne die Hauptoperation zu unterbrechen
export async function createAuditLog(
  input: AuditLogInput,
): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    await AuditLog.create(input);
  } catch (error) {
    console.error("Audit-Log konnte nicht gespeichert werden:", error);
  }
}
