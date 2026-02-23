import mongoose from 'mongoose';

const updateHistorySchema = new mongoose.Schema({
  imei: {
    type: String,
    required: true,
    index: true
  },
  updateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveUpdate',
    required: true
  },
  oldVersion: String,
  newVersion: String,
  status: {
    type: String,
    enum: ['scheduled', 'notified', 'download_started', 'download_completed', 'installation_started', 'installation_completed', 'failed', 'rejected'],
    required: true
  },
  stage: String,
  failureReason: String,
  adminId: String,
  targetCriteria: {
    region: String,
    version: String
  },
  timeline: [{
    event: String,
    timestamp: Date,
    details: String
  }]
}, { timestamps: true });

updateHistorySchema.index({ imei: 1, createdAt: -1 });

const UpdateHistory = mongoose.model('UpdateHistory', updateHistorySchema);

export default UpdateHistory;
