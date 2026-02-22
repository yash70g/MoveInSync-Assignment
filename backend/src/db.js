const mongoose = require("mongoose");

uri=process.env.MONGO_URI || "mongodb://localhost:27017/movein";
async function connectMongo(uri) {
  if (!uri) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(uri, {
    autoIndex: true
  });
}

module.exports = {
  connectMongo
};
