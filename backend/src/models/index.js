const Device = require("./device.model");
const AppVersion = require("./appVersion.model");
const Rollout = require("./rollout.model");
const VersionTransition = require("./versionTransition.model");
const DeviceUpdate = require("./deviceUpdate.model");
const AuditEvent = require("./auditEvent.model");
const Heartbeat = require("./heartbeat.model");

async function createAuditEvent(data) {
  return AuditEvent.create(data);
}

async function createHeartbeat(data) {
  return Heartbeat.create(data);
}

module.exports = {
  Device,
  AppVersion,
  Rollout,
  VersionTransition,
  DeviceUpdate,
  AuditEvent,
  Heartbeat,
  createAuditEvent,
  createHeartbeat
};
