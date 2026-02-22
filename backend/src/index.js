const express = require("express");
const cors = require("cors");
const { connectMongo } = require("./db");
const models = require("./models");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function start() {
  try {
    await connectMongo(process.env.MONGO_URI || "mongodb://localhost:27017/movein");
    console.log("MongoDB connected");
    app.post("/api/heartbeat", async (req, res) => {
      const { event, deviceId, ts } = req.body || {};
      if (!event || !deviceId || !ts) {
        return res.status(400).json({ ok: false, error: "Missing fields" });
      }
      try {
        await models.createHeartbeat({ event, deviceId, ts: new Date(ts) });
      } catch (err) {
        console.error("heartbeat store failed:", err.message);
      }
      return res.json({ ok: true });
    });

    app.listen(port, () => {
      console.log(`Server listening on ${port}`);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

start();
