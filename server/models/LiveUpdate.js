import mongoose from 'mongoose';

const liveUpdateSchema = new mongoose.Schema({
  region: {
    type: String,
    default: null
  },
  oldVersion: {
    type: String,
    required: true
  },
  newVersion: {
    type: String,
    required: true
  },
  hierarchyOrder: {
    type: [Number],
    required: true
  },
  pendingCount: {
    type: Number,
    default: 0
  },
  completedCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  targetDevices: {
    type: [String],
    required: true
  }
}, { timestamps: true });

const LiveUpdate = mongoose.model('LiveUpdate', liveUpdateSchema);

export default LiveUpdate;
