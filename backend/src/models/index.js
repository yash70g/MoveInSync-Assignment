const Device = require("./device.model");
const AppVersion = require("./appVersion.model");
const VersionTransition = require("./versionTransition.model");
const AuditEvent = require("./auditEvent.model");
const Heartbeat = require("./heartbeat.model");
const versionUtils = require("../utils/versionUtils");


async function createHeartbeat(data) {
  return Heartbeat.create(data);
}

async function getDevicesByRegionAndVersion(region, version, platform) {
  const query = {};
  if (region) query.region = region;
  if (version) query.currentVersion = version;
  if (platform) query.platform = platform;
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
  const incoming = { ...data };
  const versionName = incoming.currentVersion || incoming.version || "0.0.0";
  let versionCode = incoming.versionCode;
  if (versionCode === undefined) {
    versionCode = versionUtils.versionToCode(versionName);
  }
  const existingDevice = await Device.findOne({ deviceId });
  const oldVersionCode = existingDevice?.versionCode || 0;

  const updateDoc = {
    ...incoming,
    currentVersion: versionName,
    versionCode,
    lastHeartbeatAt: new Date()
  };
  if (existingDevice && oldVersionCode !== versionCode) {
    updateDoc.$push = {
      versionHistory: {
        versionName,
        versionCode,
        updatedAt: new Date(),
        source: incoming.source || "heartbeat"
      }
    };
    const { $push, ...setFields } = updateDoc;
    return Device.findOneAndUpdate(
      { deviceId },
      { $set: setFields, $push },
      { new: true }
    );
  }

  if (!existingDevice) {
    updateDoc.versionHistory = [{
      versionName,
      versionCode,
      updatedAt: new Date(),
      source: incoming.source || "registration"
    }];
    return Device.findOneAndUpdate(
      { deviceId },
      updateDoc,
      { upsert: true, new: true }
    );
  }
  return Device.findOneAndUpdate(
    { deviceId },
    { $set: updateDoc },
    { new: true }
  );
}

async function registerDevice(deviceData) {
  return Device.create(deviceData);
}
async function getDeviceVersionHistory(deviceId) {
  const device = await Device.findOne({ deviceId }).lean();
  if (!device) return null;
  return {
    deviceId: device.deviceId,
    currentVersion: device.currentVersion,
    versionCode: device.versionCode,
    platform: device.platform,
    versionHistory: device.versionHistory || []
  };
}

// Create audit event with hash chain
const crypto = require('crypto');

function computeHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

async function createAuditEvent({ entityType, entityId, action, actorId, payload }) {
  // Get last audit event for hash chain
  const lastEvent = await AuditEvent.findOne({ entityType, entityId }).sort({ occurredAt: -1 }).lean();
  const hashPrev = lastEvent ? lastEvent.hashCurrent : null;
  
  const hashData = { entityType, entityId, action, actorId, payload, hashPrev, ts: Date.now() };
  const hashCurrent = computeHash(hashData);
  
  return AuditEvent.create({
    entityType,
    entityId,
    action,
    actorId,
    payload,
    hashPrev,
    hashCurrent,
    occurredAt: new Date()
  });
}

async function getAuditEvents(entityType, entityId, limit = 50) {
  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;
  return AuditEvent.find(filter).sort({ occurredAt: -1 }).limit(limit).lean();
}

module.exports = {
  Device,
  AppVersion,
  VersionTransition,
  AuditEvent,
  Heartbeat,
  createHeartbeat,
  getDevicesByRegionAndVersion,
  getDeviceCountByRegionAndVersion,
  getAllDevices,
  updateDeviceHeartbeat,
  registerOrUpdateDevice,
  registerDevice,
  getDeviceVersionHistory,
  createAuditEvent,
  getAuditEvents
};