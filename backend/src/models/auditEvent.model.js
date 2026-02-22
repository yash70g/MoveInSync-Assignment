const mongoose = require("mongoose");

const AuditEventSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    action: { type: String, required: true },
    actorId: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    hashPrev: { type: String, default: null },
    hashCurrent: { type: String, required: true },
    occurredAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: "audit_events" }
);

module.exports = mongoose.model("AuditEvent", AuditEventSchema);
