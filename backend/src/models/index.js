const Device = require("./device.model");
const AppVersion = require("./appVersion.model");
const VersionTransition = require("./versionTransition.model");
const AuditEvent = require("./auditEvent.model");
const Heartbeat = require("./heartbeat.model");
const UpdateState = require("./updateState.model");
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

// Update State Management
async function createUpdateState(updateData) {
  const updateId = `upd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return UpdateState.create({
    ...updateData,
    updateId
  });
}

async function getUpdateState(updateId) {
  return UpdateState.findOne({ updateId }).lean();
}

async function getDeviceUpdates(deviceId) {
  return UpdateState.find({ deviceId }).sort({ scheduledAt: -1 }).lean();
}

async function updateStateTransition(updateId, newStage, details = {}) {
  const update = await UpdateState.findOne({ updateId });
  if (!update) return null;
  
  const timelineEvent = {
    stage: newStage,
    timestamp: new Date(),
    details
  };
  
  const newStatus = newStage === 'Completed' ? 'completed' : newStage === 'Failed' ? 'failed' : 'in-progress';
  
  return UpdateState.findOneAndUpdate(
    { updateId },
    {
      $set: { currentStage: newStage, status: newStatus },
      $push: { timeline: timelineEvent }
    },
    { new: true }
  );
}

async function recordUpdateFailure(updateId, failureStage, failureReason) {
  const update = await UpdateState.findOne({ updateId });
  if (!update) return null;
  
  const shouldRetry = update.retryCount < update.maxRetries;
  
  const timelineEvent = {
    stage: 'Failed',
    timestamp: new Date(),
    failureStage,
    failureReason,
    details: { retriable: shouldRetry }
  };
  
  return UpdateState.findOneAndUpdate(
    { updateId },
    {
      $set: { 
        currentStage: 'Failed', 
        status: 'failed',
        lastRetryAt: new Date()
      },
      $push: { timeline: timelineEvent },
      $inc: { retryCount: 1 }
    },
    { new: true }
  );
}

async function approveUpdate(updateId, approverAdminId) {
  return UpdateState.findOneAndUpdate(
    { updateId },
    {
      $set: {
        approvalStatus: 'approved',
        approvedBy: approverAdminId,
        approvedAt: new Date()
      }
    },
    { new: true }
  );
}

async function rejectUpdate(updateId, approverAdminId) {
  return UpdateState.findOneAndUpdate(
    { updateId },
    {
      $set: {
        approvalStatus: 'rejected',
        approvedBy: approverAdminId,
        approvedAt: new Date()
      }
    },
    { new: true }
  );
}

async function getRolloutProgress(updateId) {
  const updates = await UpdateState.find({ updateId }).lean();
  if (updates.length === 0) return null;
  
  const completed = updates.filter(u => u.status === 'completed').length;
  const failed = updates.filter(u => u.status === 'failed').length;
  const pending = updates.filter(u => u.status === 'pending').length;
  const inProgress = updates.filter(u => u.status === 'in-progress').length;
  
  return {
    total: updates.length,
    completed,
    failed,
    pending,
    inProgress,
    successRate: updates.length > 0 ? ((completed / updates.length) * 100).toFixed(2) : 0,
    failureRate: updates.length > 0 ? ((failed / updates.length) * 100).toFixed(2) : 0
  };
}

module.exports = {
  Device,
  AppVersion,
  VersionTransition,
  AuditEvent,
  Heartbeat,
  UpdateState,
  createHeartbeat,
  getDevicesByRegionAndVersion,
  getDeviceCountByRegionAndVersion,
  getAllDevices,
  updateDeviceHeartbeat,
  registerOrUpdateDevice,
  registerDevice,
  getDeviceVersionHistory,
  createAuditEvent,
  getAuditEvents,
  createUpdateState,
  getUpdateState,
  getDeviceUpdates,
  updateStateTransition,
  recordUpdateFailure,
  approveUpdate,
  rejectUpdate,
  getRolloutProgress
};