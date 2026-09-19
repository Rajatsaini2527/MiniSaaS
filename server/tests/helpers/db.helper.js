'use strict';

const mongoose = require('mongoose');

async function connectTestDB() {
  const uri = process.env.MONGODB_URI || process.env.__MONGO_URI__;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

async function disconnectTestDB() {
  await mongoose.disconnect();
}

async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = { connectTestDB, disconnectTestDB, clearTestDB };
