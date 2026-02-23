const mongoose = require("mongoose");

const VersionHistorySchema = new mongoose.Schema(
  {
    versionName: { type: String, required: true },
    versionCode: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now },
    source: { type: String, default: "heartbeat" } // heartbeat, manual, rollout
  },
  { _id: false }
);

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true }, //IMEI
    platform: { type: String, required: true }, // e.g., device os
    currentVersion: { type: String, default: "0.0.0" },
    versionCode: { type: Number, default: 0 },
    versionHistory: { type: [VersionHistorySchema], default: [] }, // Track all version changes
    status: { type: String, default: "active" },
    region: { type: String, default: "Bangalore" }, //location
    lastHeartbeatAt: { type: Date, default: null }, //last app open time
    pendingUpdate: {
      targetVersionCode: { type: Number, default: null },
      targetVersionName: { type: String, default: null },
      requestedAt: { type: Date, default: null },
      requestedBy: { type: String, default: null }
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: "devices" }
);

module.exports = mongoose.model("Device", DeviceSchema);

// IMEI Number (Primary Identifier)
// ● App Version
// ● Device OS & Model (optional but recommended)
// ● Last App Open Time
// ● Location/Region Tag