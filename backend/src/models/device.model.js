const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true }, //IMEI
    platform: { type: String, required: true }, // e.g., device os
    currentVersion: { type: String, default: "0.0.0" },
    status: { type: String, default: "active" },
    region: { type: String, default: "Bangalore" }, //location
    lastHeartbeatAt: { type: Date, default: null }, //last app open time
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