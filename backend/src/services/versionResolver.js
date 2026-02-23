const AppVersion = require("../models/appVersion.model");
const VersionTransition = require("../models/versionTransition.model");

async function getLatestVersion(appId, platform) {
  return AppVersion.findOne({
    appId,
    platform,
    isActive: true
  })
    .sort({ versionCode: -1 })
    .lean();
}

async function getUpgradePath(appId, platform, fromVersionCode, toVersionCode) {
  if (fromVersionCode === toVersionCode) {
    return [fromVersionCode];
  }

  const transition = await VersionTransition.findOne({
    appId,
    platform,
    fromVersionCode,
    toVersionCode,
    isActive: true,
    isAllowed: true
  });

  if (!transition) return null;

  return transition.intermediateVersionCode
    ? [fromVersionCode, transition.intermediateVersionCode, toVersionCode]
    : [fromVersionCode, toVersionCode];
}

/**
 * Check if device needs an update (current < latest)
 */
async function deviceNeedsUpdate(appId, platform, currentVersionCode) {
  const latest = await getLatestVersion(appId, platform);

  if (!latest) {
    return { needsUpdate: false, reason: "No version found" };
  }

  if (currentVersionCode < latest.versionCode) {
    return {
      needsUpdate: true,
      currentVersionCode,
      latestVersionCode: latest.versionCode,
      latestVersionName: latest.versionName,
      reason: `Update available: ${latest.versionName}`
    };
  }

  return { needsUpdate: false, reason: "Already on latest version" };
}

module.exports = {
  getLatestVersion,
  getUpgradePath,
  deviceNeedsUpdate
};
