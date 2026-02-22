const mongoose = require("mongoose");

const heartbeatSchema = new mongoose.Schema({
  event: { type: String, required: true },
  deviceId: { type: String, required: true },
  ts: { type: Date, required: true },
  version: { type: String, default: "0.0.0" },
  receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Heartbeat", heartbeatSchema, "heartbeats");