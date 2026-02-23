const mongoose = require("mongoose");

const VersionTransitionSchema = new mongoose.Schema(
  {
    appId: { type: String, required: true },
    platform: { type: String, required: true },
    fromVersionCode: { type: Number, required: true },
    toVersionCode: { type: Number, required: true },
    isAllowed: { type: Boolean, default: true },
    mandatoryIntermediateVersionCode: { type: Number, default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: "version_transitions" }
);

VersionTransitionSchema.index({ appId: 1, platform: 1, fromVersionCode: 1, toVersionCode: 1 }, { unique: true });


module.exports = mongoose.model("VersionTransition", VersionTransitionSchema);
