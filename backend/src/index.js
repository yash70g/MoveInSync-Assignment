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

    app.post("/api/heartbeat", async(req, res)=> {
      const { event, deviceId, ts, version } = req.body || {};
      if(!event || !deviceId || !ts){
        return res.status(400).json({ ok: false, error: "Missing fields" });
      }
      try {
        await models.createHeartbeat({ event, deviceId, ts: new Date(ts), version });
        await models.updateDeviceHeartbeat(deviceId);
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
        const count = await models.getDeviceCountByRegionAndVersion(region, version);
        return res.json({
          ok: true,
          query: { region, version },
          count,
          devices
        });
      } catch(err){
        console.error("Failed to query devices:", err.message);
        return res.status(500).json({ ok: false, error: err.message });
      }
    });

    app.get("/api/devices/check-live", async(req, res)=> {
      try {
        const {region} = req.query;
        const filters = {};
        if(region)filters.region = region;
        const devices = await models.getAllDevices(filters);
        if (devices.length === 0) {
          return res.json({
            ok: true,
            region: region || "all",
            totalDevices: 0,
            liveDevices: 0,
            livePercentage: "0",
            devices: []
          });
        }
        const latestHeartbeat = devices
          .filter(d => d.lastHeartbeatAt)
          .sort((a, b) => new Date(b.lastHeartbeatAt) - new Date(a.lastHeartbeatAt))[0];
        if (!latestHeartbeat) {
          return res.json({
            ok: true,
            region: region || "all",
            totalDevices: devices.length,
            liveDevices: 0,
            livePercentage: "0",
            devices: []
          });
        }

        const latestDate = new Date(latestHeartbeat.lastHeartbeatAt);
        const dateStr = latestDate.toISOString().split('T')[0];
        const startOfDay = new Date(latestDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(latestDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const liveDevices = devices.filter(device => {
          return device.lastHeartbeatAt && 
                 new Date(device.lastHeartbeatAt) >= startOfDay && 
                 new Date(device.lastHeartbeatAt) <= endOfDay;
        });
        
        return res.json({
          ok: true,
          region: region || "all",
          date: dateStr,
          totalDevices: devices.length,
          liveDevices: liveDevices.length,
          livePercentage: devices.length > 0 ? ((liveDevices.length / devices.length) * 100).toFixed(2) : "0",
          devices: liveDevices
        });
      } catch(err){
        console.error("Failed to check live devices:", err.message);
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
