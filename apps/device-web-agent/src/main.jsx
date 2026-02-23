import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const APP_ID = "device-web-agent";
const PLATFORM = "web";
const DEFAULT_VERSION = "0.0.0";

function getOrCreateDeviceId() {
  const key = "deviceId";
  let id = localStorage.getItem(key);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(key, id);
  }

  return id;
}

function getCurrentVersion() {
  return localStorage.getItem("deviceVersion") || DEFAULT_VERSION;
}

function setCurrentVersion(version) {
  localStorage.setItem("deviceVersion", version);
}

function versionToCode(version) {
  if (!version) return 0;
  const parts = String(version).split('.').map(p => parseInt(p) || 0);
  return (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}

async function getUpgradePath(fromVersionCode, toVersionCode) {
  try {
    const res = await fetch(`${API_BASE}/api/versions/upgrade-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: APP_ID,
        platform: PLATFORM,
        fromVersionCode,
        toVersionCode
      })
    });
    const data = await res.json();
    return data.ok ? data.path : null;
  } catch {
    return null;
  }
}

async function getAllVersions() {
  try {
    const res = await fetch(`${API_BASE}/api/versions?platform=${PLATFORM}`);
    const data = await res.json();
    return data.ok ? data.versions.sort((a, b) => a.versionCode - b.versionCode) : [];
  } catch {
    return [];
  }
}

function buildUpgradePath(currentCode, targetCode, versions) {
  const path = [];
  for (const v of versions) {
    if (v.versionCode > currentCode && v.versionCode <= targetCode) {
      path.push(v);
    }
  }
  return path;
}

// ============ UPDATE STATE TRACKING ============
async function acknowledgeUpdate(updateId) {
  try {
    const res = await fetch(`${API_BASE}/api/updates/${updateId}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getOrCreateDeviceId() })
    });
    return await res.json();
  } catch (err) {
    console.error("Acknowledge failed:", err);
    return null;
  }
}

async function reportDownloadStarted(updateId) {
  try {
    const res = await fetch(`${API_BASE}/api/updates/${updateId}/download-started`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getOrCreateDeviceId() })
    });
    return await res.json();
  } catch (err) {
    console.error("Download start report failed:", err);
    return null;
  }
}

async function reportDownloadCompleted(updateId, fileSizeBytes = 0) {
  try {
    const res = await fetch(`${API_BASE}/api/updates/${updateId}/download-completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getOrCreateDeviceId(), fileSizeBytes })
    });
    return await res.json();
  } catch (err) {
    console.error("Download complete report failed:", err);
    return null;
  }
}

async function reportInstallationStarted(updateId) {
  try {
    const res = await fetch(`${API_BASE}/api/updates/${updateId}/install-started`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getOrCreateDeviceId() })
    });
    return await res.json();
  } catch (err) {
    console.error("Installation start report failed:", err);
    return null;
  }
}

async function reportInstallationCompleted(updateId) {
  try {
    const res = await fetch(`${API_BASE}/api/updates/${updateId}/install-completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getOrCreateDeviceId() })
    });
    return await res.json();
  } catch (err) {
    console.error("Installation complete report failed:", err);
    return null;
  }
}

async function reportUpdateFailed(updateId, failureStage, failureReason) {
  try {
    const res = await fetch(`${API_BASE}/api/updates/${updateId}/failed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getOrCreateDeviceId(), failureStage, failureReason })
    });
    return await res.json();
  } catch (err) {
    console.error("Failure report failed:", err);
    return null;
  }
}

const updateToVersion = async versionName => {
  try {
    await fetch(`${API_BASE}/api/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "version_update", deviceId: getOrCreateDeviceId(), ts: new Date().toISOString(), appId: APP_ID, platform: PLATFORM, version: versionName, region: "Default" })
    });
    setCurrentVersion(versionName);
    return true;
  } catch { return false; }
};

async function processUpgradePath(targetVersionCode, targetVersionName, updateId = null) {
  const currentVersion = getCurrentVersion();
  const currentCode = versionToCode(currentVersion);
  const versions = await getAllVersions();
  const upgradePath = buildUpgradePath(currentCode, targetVersionCode, versions);
  
  try {
    if (updateId) await acknowledgeUpdate(updateId);
    if (updateId) await reportDownloadStarted(updateId);
    
    if (!upgradePath.length) {
      if (confirm(`Update to ${targetVersionName}?\nCurrent: ${currentVersion}`)) {
        if (updateId) await reportDownloadCompleted(updateId);
        if (updateId) await reportInstallationStarted(updateId);
        await updateToVersion(targetVersionName);
        if (updateId) await reportInstallationCompleted(updateId);
        alert(`Updated to ${targetVersionName}`);
      }
      return;
    }
    
    if (updateId) await reportDownloadCompleted(updateId);
    if (updateId) await reportInstallationStarted(updateId);
    
    for (let i = 0; i < upgradePath.length; ++i) {
      const v = upgradePath[i];
      if (!confirm(`Step ${i + 1}/${upgradePath.length}: ${getCurrentVersion()} → ${v.versionName}`)) {
        if (updateId) await reportUpdateFailed(updateId, "InstallationStarted", "User cancelled update");
        alert("Update cancelled.");
        return;
      }
      await new Promise(r => setTimeout(r, 500));
      if (!await updateToVersion(v.versionName)) {
        if (updateId) await reportUpdateFailed(updateId, "InstallationStarted", "Version update failed");
        alert(`Failed to update to ${v.versionName}`);
        return;
      }
    }
    
    if (updateId) await reportInstallationCompleted(updateId);
    alert(`All updates complete!\nNow running ${getCurrentVersion()}`);
  } catch (err) {
    if (updateId) await reportUpdateFailed(updateId, "Unknown", err.message);
    console.error("Upgrade path processing failed:", err);
  }
}

const sendHeartbeat = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "device_open", deviceId: getOrCreateDeviceId(), ts: new Date().toISOString(), appId: APP_ID, platform: PLATFORM, version: getCurrentVersion(), region: "Default" }),
      keepalive: true,
    });
    const data = await response.json();
    if (data.updateAlert?.needsUpdate)
      await processUpgradePath(data.updateAlert.latestVersionCode, data.updateAlert.latestVersionName);
  } catch {}
};

sendHeartbeat();
setInterval(sendHeartbeat, 5 * 60 * 1000);

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
