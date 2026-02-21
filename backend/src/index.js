const { connectMongo } = require("./db");
const models = require("./models");

async function boot() {
  if (!process.env.MONGO_URI) {
    console.log("Set MONGO_URI to connect MongoDB.");
    return;
  }

  await connectMongo(process.env.MONGO_URI);
  console.log("Mongo connected. Models loaded:", Object.keys(models));
}

boot().catch((error) => {
  console.error("Backend boot failed", error);
  process.exit(1);
});
