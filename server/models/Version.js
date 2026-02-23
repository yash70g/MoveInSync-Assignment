import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema({
  versionString: {
    type: String,
    required: true,
    unique: true
  },
  versionCode: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  checksum: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

versionSchema.index({ versionCode: -1 });

const Version = mongoose.model('Version', versionSchema);

export default Version;
