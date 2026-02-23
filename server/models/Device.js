import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  imei: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  region: {
    type: String,
    required: true
  },
  currentVersion: {
    type: String,
    required: true
  },
  lastHeartbeat: {
    type: Date,
    required: true,
    default: Date.now
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Device = mongoose.model('Device', deviceSchema);

export default Device;
