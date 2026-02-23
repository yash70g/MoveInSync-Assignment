const mongoose = require("mongoose");

// Tracks each update lifecycle event per device
const TimelineEventSchema = new mongoose.Schema({
  stage: { 
    type: String, 
    enum: ['UpdateScheduled', 'DeviceNotified', 'DownloadStarted', 'DownloadCompleted', 'InstallationStarted', 'InstallationCompleted', 'Failed'],
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  failureReason: { type: String, default: null },
  failureStage: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const UpdateStateSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  updateId: { type: String, required: true, unique: true },
  targetVersionCode: { type: Number, required: true },
  targetVersionName: { type: String, required: true },
  currentStage: { 
    type: String, 
    enum: ['UpdateScheduled', 'DeviceNotified', 'DownloadStarted', 'DownloadCompleted', 'InstallationStarted', 'InstallationCompleted', 'Failed', 'Completed'],
    default: 'UpdateScheduled'
  },
  status: { type: String, enum: ['pending', 'in-progress', 'completed', 'failed'], default: 'pending' },
  scheduledAt: { type: Date, required: true },
  scheduledBy: { type: String, required: true },
  timeline: { type: [TimelineEventSchema], default: [] },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: String, default: null },
  approvedAt: { type: Date, default: null },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  lastRetryAt: { type: Date, default: null }
}, { timestamps: true, collection: "update_states" });

module.exports = mongoose.model("UpdateState", UpdateStateSchema);
