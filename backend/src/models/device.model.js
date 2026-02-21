const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    appId: { type: String, required: true },
    platform: { type: String, required: true },
    currentVersion: { type: String, default: "0.0.0" },
    status: { type: String, default: "active" },
    lastHeartbeatAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: "devices" }
);

module.exports = mongoose.model("Device", DeviceSchema);
