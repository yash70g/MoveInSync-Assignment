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
    app.listen(port,()=> {
      console.log(`Server listening on ${port}`);
    });
}

start();
