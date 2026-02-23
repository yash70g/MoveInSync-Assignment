const mongoose = require("mongoose");

const AppVersionSchema = new mongoose.Schema(
  {
    appId: { type: String, required: true },
    platform: { type: String, required: true },
    versionCode: { type: Number, required: true },
    versionName: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: "app_versions" }
);

AppVersionSchema.index({ appId: 1, platform: 1, versionCode: 1 }, { unique: true });

module.exports = mongoose.model("AppVersion", AppVersionSchema);
