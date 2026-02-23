const express = require("express");
const cors = require("cors");
const { connectMongo } = require("./db");
const models = require("./models");
const versionResolver = require("./services/versionResolver");
const { versionToCode } = require("./utils/versionUtils");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function start(){
  let dbConnected = false;
  try {
    await connectMongo(process.env.MONGO_URI || "mongodb://localhost:27017/movein");
    dbConnected = true;
    console.log("MongoDB connected");
  } catch(err) {
    console.warn("Warning: Failed to connect to MongoDB. Starting server in degraded mode.", err.message);
  }

  app.get("/api/version", async(req, res)=> {
      try {
        const latestVersion = await models.AppVersion.findOne().sort({ createdAt: -1 });
        const version = latestVersion ? latestVersion.version : "0.0.0";
        return res.json({ version });
      } catch(err){
        return res.json({ version: "0.0.0" });
      }
    });

    app.post("/api/devices/register", async(req, res)=> {
      try {
        const { deviceId, platform, currentVersion, region, metadata } = req.body || {};
        
        if (!deviceId || !platform) {
          return res.status(400).json({ 
            ok: false, 
            error: "deviceId and platform are required" 
          });
        }

        const device = await models.registerOrUpdateDevice(deviceId, {
          deviceId,
          platform,
          currentVersion: currentVersion || "0.0.0",
          status: "active",
          region: region || "Bangalore",
          metadata: metadata || {}
        });

        return res.json({
          ok: true,
          device
        });
      } catch(err){
        console.error("Device registration failed:", err.message);
        return res.status(500).json({ ok: false, error: err.message });
      }
    });

    app.post("/api/heartbeat", async(req, res)=> {
      const { event, deviceId, ts, version, platform, region, appId } = req.body || {};
      if(!event || !deviceId || !ts){
        return res.status(400).json({ ok: false, error: "Missing fields" });
      }
      try {
        const device = await models.registerOrUpdateDevice(deviceId, {
          deviceId,
          platform: platform || "unknown",
          currentVersion: version || "0.0.0",
          status: "active",
          region: region || "Bangalore"
        });
        await models.createHeartbeat({ event, deviceId, ts: new Date(ts), version });
        let updateAlert = null;
        if (device.pendingUpdate && device.pendingUpdate.targetVersionCode) {
          const currentCode = versionToCode(version);
          if (device.pendingUpdate.targetVersionCode > currentCode) {
            updateAlert = {
              needsUpdate: true,
              currentVersionCode: currentCode,
              latestVersionCode: device.pendingUpdate.targetVersionCode,
              latestVersionName: device.pendingUpdate.targetVersionName,
              reason: `Admin requested update to ${device.pendingUpdate.targetVersionName}`
            };
          }
        }
        if (!updateAlert && appId && platform && version) {
          const versionCode = versionToCode(version);
          const updateCheck = await versionResolver.deviceNeedsUpdate(appId, platform, versionCode);
          if (updateCheck.needsUpdate) {
            updateAlert = updateCheck;
          }
        }

        return res.json({ ok: true, updateAlert });
      } catch(err){
        console.error("heartbeat store failed:", err.message);
        return res.json({ ok: true }); 
      }
    });

    app.get("/api/devices", async(req, res)=> {
      try {
        const {region, version, status} = req.query;
        const filters = {};
        if(region)filters.region = region;
        if(version)filters.currentVersion = version;
        if(status)filters.status = status;
        const devices = await models.getAllDevices(filters);
        return res.json({
          ok: true,
          count: devices.length,
          devices
        });
      } catch(err){
        console.error("Failed to fetch devices:", err.message);
        return res.status(500).json({ ok: false, error: err.message });
      }
    });

    app.get("/api/devices/query", async(req, res)=> {
      try {
        const { region, version, platform } = req.query;
        if(!region && !version && !platform){
          return res.status(400).json({ 
            ok: false, 
            error: "Provide at least 'region', 'version', or 'platform' parameter" 
          });
        }
        const devices = await models.getDevicesByRegionAndVersion(region, version, platform);
        return res.json({
          ok: true,
          query: { region, version, platform },
          count: devices.length,
          devices
        });
      } catch(err){
        console.error("Failed to query devices:", err.message);
        return res.status(500).json({ ok: false, error: err.message });
      }
    });
    app.post("/api/devices/push-update", async(req, res)=> {
      try {
        const { deviceIds, targetVersionCode, targetVersionName, requestedBy } = req.body;
        if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
          return res.status(400).json({ ok: false, error: "deviceIds required" });
        }
        if (!targetVersionCode || !targetVersionName) {
          return res.status(400).json({ ok: false, error: "version required" });
        }

        const result = await models.Device.updateMany(
          { deviceId: { $in: deviceIds } },
          {
            $set: {
              pendingUpdate: {
                targetVersionCode,
                targetVersionName,
                requestedAt: new Date(),
                requestedBy: requestedBy || "admin"
              }
            }
          }
        );
        const auditPromises = deviceIds.map(deviceId => 
          models.createAuditEvent({
            entityType: "device",
            entityId: deviceId,
            action: "push_update",
            actorId: requestedBy || "admin",
            payload: {
              targetVersionCode,
              targetVersionName,
              requestedAt: new Date().toISOString()
            }
          })
        );
        await Promise.all(auditPromises);
        return res.json({
          ok: true,
          updated: result.modifiedCount,
          message: `Update to ${targetVersionName} pushed to ${result.modifiedCount} device(s)`
        });
      } catch(err) {
        console.error("Failed to push update:", err.message);
        return res.status(500).json({ ok: false, error: "push failed" });
      }
    });

    app.get("/api/versions", async(req, res)=> {
      try {
        const { appId, platform } = req.query;
        const filter = { isActive: true };
        if (appId) filter.appId = appId;
        if (platform) filter.platform = platform;
        const versions = await models.AppVersion.find(filter).sort({ versionCode: -1 }).lean();
        return res.json({ ok: true, versions });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });
    app.get("/api/audit-events", async(req, res)=> {
      try {
        const { entityType, entityId, limit } = req.query;
        const events = await models.getAuditEvents(entityType, entityId, parseInt(limit) || 50);
        return res.json({ ok: true, count: events.length, events });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });

    app.get("/api/devices/:deviceId/audit-events", async(req, res)=> {
      try {
        const { deviceId } = req.params;
        const events = await models.getAuditEvents("device", deviceId);
        return res.json({ ok: true, deviceId, count: events.length, events });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });

    app.get("/api/devices/:deviceId/version-history", async(req, res)=> {
      try {
        const { deviceId } = req.params;
        const history = await models.getDeviceVersionHistory(deviceId);
        if (!history) {
          return res.status(404).json({ ok: false, error: "not found" });
        }
        return res.json({ ok: true, ...history });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });

    app.get("/api/versions/latest", async(req, res)=> {
      try {
        const { appId, platform } = req.query;
        if (!appId || !platform) {
          return res.status(400).json({ ok: false, error: "id/platform required" });
        }
        const version = await versionResolver.getLatestVersion(appId, platform);
        if (!version) {
          return res.status(404).json({ ok: false, error: "not found" });
        }

        return res.json({ ok: true, version });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });
    app.post("/api/versions/upgrade-path", async(req, res)=> {
      try {
        const { appId, platform, fromVersionCode, toVersionCode } = req.body;
        if (!appId || !platform || fromVersionCode === undefined || toVersionCode === undefined) {
          return res.status(400).json({ ok: false, error: "missing params" });
        }
        const path = await versionResolver.getUpgradePath(appId, platform, fromVersionCode, toVersionCode);
        if (!path) {
          return res.status(400).json({ ok: false, error: "no path" });
        }
        return res.json({ ok: true, path });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });
    app.get("/api/devices/needs-update", async(req, res)=> {
      try {
        const { appId, platform } = req.query;
        if (!appId || !platform) {
          return res.status(400).json({ ok: false, error: "id/platform required" });
        }
        const latestVersion = await versionResolver.getLatestVersion(appId, platform);
        if (!latestVersion) {
          return res.json({ ok: true, devices: [], latestVersion: null });
        }

        const devices = await models.getAllDevices({ platform });
        const devicesNeedingUpdate = devices.filter(device => {
          const deviceVersionCode = device.versionCode || versionToCode(device.currentVersion);
          return deviceVersionCode < latestVersion.versionCode;
        });

        return res.json({
          ok: true,
          latestVersion: latestVersion.versionName,
          latestVersionCode: latestVersion.versionCode,
          totalDevices: devices.length,
          devicesNeedingUpdate: devicesNeedingUpdate.length,
          devices: devicesNeedingUpdate
        });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });
    app.post("/api/versions/create", async(req, res)=> {
      try {
        const { appId, platform, versionCode, versionName } = req.body;
        if (!appId || !platform || versionCode === undefined || !versionName) {
          return res.status(400).json({ ok: false, error: "missing params" });
        }
        const version = await models.AppVersion.create({
          appId,
          platform,
          versionCode,
          versionName,
          isActive: true
        });

        return res.status(201).json({ ok: true, version });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "create failed" });
      }
    });
    app.post("/api/versions/transition", async(req, res)=> {
      try {
        const { appId, platform, fromVersionCode, toVersionCode, isAllowed, intermediateVersionCode } = req.body;
        if (!appId || !platform || fromVersionCode === undefined || toVersionCode === undefined) {
          return res.status(400).json({ ok: false, error: "missing params" });
        }

        const transition = await models.VersionTransition.create({
          appId,
          platform,
          fromVersionCode,
          toVersionCode,
          isAllowed: isAllowed !== false,
          intermediateVersionCode: intermediateVersionCode || null,
          isActive: true
        });
        return res.status(201).json({ ok: true, transition });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "create failed" });
      }
    });

    app.post("/api/updates/schedule", async(req, res)=> {
      try {
        const { deviceIds, targetVersionCode, targetVersionName, scheduledBy, requiresApproval } = req.body;
        if (!deviceIds || !Array.isArray(deviceIds) || !targetVersionCode || !targetVersionName) {
          return res.status(400).json({ ok: false, error: "missing required fields" });
        }

        const updatePromises = deviceIds.map(deviceId => 
          models.createUpdateState({
            deviceId,
            targetVersionCode,
            targetVersionName,
            scheduledAt: new Date(),
            scheduledBy: scheduledBy || "admin",
            approvalStatus: requiresApproval ? 'pending' : 'approved'
          })
        );
        
        const updates = await Promise.all(updatePromises);
        
        await models.createAuditEvent({
          entityType: "update_schedule",
          entityId: updates[0].updateId,
          action: "schedule_update",
          actorId: scheduledBy || "admin",
          payload: { deviceCount: deviceIds.length, targetVersionName, requiresApproval }
        });

        return res.status(201).json({ 
          ok: true, 
          scheduledCount: updates.length,
          updates: updates.map(u => ({ updateId: u.updateId, deviceId: u.deviceId }))
        });
      } catch(err) {
        console.error("Update schedule failed:", err.message);
        return res.status(500).json({ ok: false, error: "schedule failed" });
      }
    });

    app.post("/api/updates/:updateId/acknowledge", async(req, res)=> {
      try {
        const { updateId } = req.params;
        const { deviceId } = req.body;
        
        const update = await models.updateStateTransition(updateId, 'DeviceNotified', {
          deviceId,
          acknowledgedAt: new Date().toISOString()
        });

        if (!update) {
          return res.status(404).json({ ok: false, error: "update not found" });
        }

        await models.createAuditEvent({
          entityType: "update",
          entityId: updateId,
          action: "device_acknowledged",
          actorId: deviceId,
          payload: { acknowledgedAt: new Date().toISOString() }
        });

        return res.json({ ok: true, message: "Update acknowledged", update });
      } catch(err) {
        console.error("Acknowledge failed:", err.message);
        return res.status(500).json({ ok: false, error: "acknowledge failed" });
      }
    });

    // Device: Report download started
    app.post("/api/updates/:updateId/download-started", async(req, res)=> {
      try {
        const { updateId } = req.params;
        const { deviceId } = req.body;
        
        const update = await models.updateStateTransition(updateId, 'DownloadStarted', {
          deviceId,
          startedAt: new Date().toISOString()
        });

        if (!update) {
          return res.status(404).json({ ok: false, error: "update not found" });
        }

        return res.json({ ok: true, message: "Download started", update });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "failed" });
      }
    });
    app.post("/api/updates/:updateId/download-completed", async(req, res)=> {
      try {
        const { updateId } = req.params;
        const { deviceId, fileSizeBytes } = req.body;
        
        const update = await models.updateStateTransition(updateId, 'DownloadCompleted', {
          deviceId,
          completedAt: new Date().toISOString(),
          fileSizeBytes
        });

        if (!update) {
          return res.status(404).json({ ok: false, error: "update not found" });
        }

        return res.json({ ok: true, message: "Download completed", update });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "failed" });
      }
    });
    app.post("/api/updates/:updateId/install-started", async(req, res)=> {
      try {
        const { updateId } = req.params;
        const { deviceId } = req.body;
        
        const update = await models.updateStateTransition(updateId, 'InstallationStarted', {
          deviceId,
          startedAt: new Date().toISOString()
        });

        if (!update) {
          return res.status(404).json({ ok: false, error: "update not found" });
        }

        return res.json({ ok: true, message: "Installation started", update });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "failed" });
      }
    });
    app.post("/api/updates/:updateId/install-completed", async(req, res)=> {
      try {
        const { updateId } = req.params;
        const { deviceId } = req.body;
        
        const update = await models.updateStateTransition(updateId, 'InstallationCompleted', {
          deviceId,
          completedAt: new Date().toISOString()
        });

        if (!update) {
          return res.status(404).json({ ok: false, error: "update not found" });
        }
        await models.Device.findOneAndUpdate(
          { deviceId },
          { 
            currentVersion: update.targetVersionName,
            versionCode: update.targetVersionCode,
            $push: { versionHistory: {
              versionName: update.targetVersionName,
              versionCode: update.targetVersionCode,
              updatedAt: new Date(),
              source: "update_install"
            }},
            $set: { pendingUpdate: null }
          }
        );

        await models.createAuditEvent({
          entityType: "update",
          entityId: updateId,
          action: "installation_completed",
          actorId: deviceId,
          payload: { newVersion: update.targetVersionName }
        });

        return res.json({ ok: true, message: "Installation completed", update });
      } catch(err) {
        console.error("Installation complete failed:", err.message);
        return res.status(500).json({ ok: false, error: "failed" });
      }
    });

    app.post("/api/updates/:updateId/failed", async(req, res)=> {
      try {
        const { updateId } = req.params;
        const { deviceId, failureStage, failureReason } = req.body;
        
        if (!failureStage || !failureReason) {
          return res.status(400).json({ ok: false, error: "failureStage and failureReason required" });
        }

        const update = await models.recordUpdateFailure(updateId, failureStage, failureReason);
        if (!update) {
          return res.status(404).json({ ok: false, error: "update not found" });
        }

        await models.createAuditEvent({
          entityType: "update",
          entityId: updateId,
          action: "update_failed",
          actorId: deviceId,
          payload: { failureStage, failureReason, retryCount: update.retryCount }
        });

        return res.json({ 
          ok: true, 
          message: "Failure recorded", 
          update,
          canRetry: update.retryCount < update.maxRetries
        });
      } catch(err) {
        console.error("Failure record failed:", err.message);
        return res.status(500).json({ ok: false, error: "failed" });
      }
    });

    app.get("/api/updates/:updateId/timeline", async(req, res)=> {
      try {
        const { updateId } = req.params;
        const update = await models.getUpdateState(updateId);
        
        if (!update) {
          return res.status(404).json({ ok: false, error: "update not found" });
        }

        const timeline = update.timeline.map(event => ({
          stage: event.stage,
          timestamp: event.timestamp,
          failureStage: event.failureStage,
          failureReason: event.failureReason,
          details: event.details
        }));

        return res.json({ 
          ok: true,
          updateId,
          deviceId: update.deviceId,
          targetVersion: update.targetVersionName,
          currentStage: update.currentStage,
          status: update.status,
          timeline
        });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });

    app.get("/api/devices/:deviceId/updates", async(req, res)=> {
      try {
        const { deviceId } = req.params;
        const updates = await models.getDeviceUpdates(deviceId);
        
        return res.json({ 
          ok: true,
          deviceId,
          count: updates.length,
          updates
        });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });

    // Get rollout progress (aggregated)
    app.get("/api/updates/:updateId/progress", async(req, res)=> {
      try {
        const { updateId } = req.params;
        const progress = await models.getRolloutProgress(updateId);
        
        if (!progress) {
          return res.status(404).json({ ok: false, error: "no updates found" });
        }

        return res.json({ ok: true, updateId, progress });
      } catch(err) {
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });
    app.get("/api/dashboard/updates", async(req, res)=> {
      try {
        const { region, platform } = req.query;
        const filters = {};
        if (region) filters.region = region;
        if (platform) filters.platform = platform;
        
        const devices = await models.getAllDevices(filters);
        const deviceIds = devices.map(d => d.deviceId);
        const updateStates = await models.UpdateState.find({ deviceId: { $in: deviceIds } }).lean();
  
        const stats = {
          totalDevices: devices.length,
          updatesScheduled: updateStates.length,
          completed: updateStates.filter(u => u.status === 'completed').length,
          failed: updateStates.filter(u => u.status === 'failed').length,
          pending: updateStates.filter(u => u.status === 'pending').length,
          inProgress: updateStates.filter(u => u.status === 'in-progress').length
        };
        
        const versionHeatmap = {};
        devices.forEach(device => {
          const version = device.currentVersion;
          versionHeatmap[version] = (versionHeatmap[version] || 0) + 1;
        });

        return res.json({ 
          ok: true,
          stats,
          versionHeatmap,
          filters: { region, platform }
        });
      } catch(err) {
        console.error("Dashboard fetch failed:", err.message);
        return res.status(500).json({ ok: false, error: "fetch failed" });
      }
    });

    app.listen(port,()=> {
      console.log(`Server listening on ${port}`);
    });
}

start();
