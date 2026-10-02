import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
  {
    userId: {
      type: String,
      required: false,
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    entityId: {
      type: String,
      required: false,
      index: true,
    },

    details: {
      type: Schema.Types.Mixed,
      required: false,
    },

    ipAddress: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Audit-Logs für wichtige Änderungen und Systemaktionen
export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
