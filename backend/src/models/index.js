const Device = require("./device.model");
// const Rollout = require("./rollout.model");
// const VersionTransition = require("./versionTransition.model");
// const DeviceUpdate = require("./deviceUpdate.model");
const AuditEvent = require("./auditEvent.model");
const Heartbeat = require("./heartbeat.model");

async function createAuditEvent(data) {
  return AuditEvent.create(data);
}

async function createHeartbeat(data) {
  return Heartbeat.create(data);
}

async function getDevicesByRegionAndVersion(region, version) {
  const query = {};
  if (region) query.region = region;
  if (version) query.currentVersion = version;
  return Device.find(query).lean();
}

async function getDeviceCountByRegionAndVersion(region, version) {
  const query = {};
  if (region) query.region = region;
  if (version) query.currentVersion = version;
  return Device.countDocuments(query);
}

async function getAllDevices(filters = {}) {
  return Device.find(filters).lean();
}

async function updateDeviceHeartbeat(deviceId, timestamp = new Date()) {
  return Device.findOneAndUpdate(
    { deviceId },
    { lastHeartbeatAt: timestamp },
    { new: true }
  );
}

async function registerOrUpdateDevice(deviceId, data = {}) {
  return Device.findOneAndUpdate(
    { deviceId },
    { ...data, lastHeartbeatAt: new Date() },
    { upsert: true, new: true }
  );
}

async function registerDevice(deviceData) {
  return Device.create(deviceData);
}

module.exports = {
  Device,
  // Rollout,
  // VersionTransition,
  // DeviceUpdate,
  AuditEvent,
  Heartbeat,
  // createAuditEvent,
  createHeartbeat,
  getDevicesByRegionAndVersion,
  getDeviceCountByRegionAndVersion,
  getAllDevices,
  updateDeviceHeartbeat,
  registerOrUpdateDevice,
  registerDevice
};
