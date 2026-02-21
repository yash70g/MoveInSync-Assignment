const mongoose = require("mongoose");

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
