const express = require("express");
const cors = require("cors");
const { connectMongo } = require("./db");
const models = require("./models");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function start(){
  try {
    await connectMongo(process.env.MONGO_URI || "mongodb://localhost:27017/movein");
    console.log("MongoDB connected");
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
      const { event, deviceId, ts, version, platform, region } = req.body || {};
      if(!event || !deviceId || !ts){
        return res.status(400).json({ ok: false, error: "Missing fields" });
      }
      try {
        // Auto-register/update device on every heartbeat
        await models.registerOrUpdateDevice(deviceId, {
          deviceId,
          platform: platform || "unknown",
          currentVersion: version || "0.0.0",
          status: "active",
          region: region || "Bangalore"
        });
        await models.createHeartbeat({ event, deviceId, ts: new Date(ts), version });
      } catch(err){
        console.error("heartbeat store failed:", err.message);
      }
      return res.json({ ok: true });
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
        const { region, version } = req.query;
        if(!region && !version){
          return res.status(400).json({ 
            ok: false, 
            error: "Provide at least 'region' or 'version' parameter" 
          });
        }
        const devices = await models.getDevicesByRegionAndVersion(region, version);
        return res.json({
          ok: true,
          query: { region, version },
          count: devices.length,
          devices
        });
      } catch(err){
        console.error("Failed to query devices:", err.message);
        return res.status(500).json({ ok: false, error: err.message });
      }
    });

    app.listen(port,()=> {
      console.log(`Server listening on ${port}`);
    });
  } catch(err){
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

start();
