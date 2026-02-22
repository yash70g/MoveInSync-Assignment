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

// Query devices by region and version
async function getDevicesByRegionAndVersion(region, version) {
  const query = {};
  if (region) query.region = region;
  if (version) query.currentVersion = version;
  
  return Device.find(query).lean();
}

// Get device count by criteria
async function getDeviceCountByRegionAndVersion(region, version) {
  const query = {};
  if (region) query.region = region;
  if (version) query.currentVersion = version;
  
  return Device.countDocuments(query);
}

// Get all devices with optional filters
async function getAllDevices(filters = {}) {
  return Device.find(filters).lean();
}

// Update device last heartbeat
async function updateDeviceHeartbeat(deviceId, timestamp = new Date()) {
  return Device.findOneAndUpdate(
    { deviceId },
    { lastHeartbeatAt: timestamp },
    { new: true }
  );
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
  updateDeviceHeartbeat
};
