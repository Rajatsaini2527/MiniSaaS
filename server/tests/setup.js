'use strict';

const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet;

module.exports = async function globalSetup() {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  await replSet.waitUntilRunning();
  const uri = replSet.getUri();

  process.env.MONGODB_URI = uri;
  process.env.MONGODB_TEST_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
  process.env.JWT_ACCESS_SECRET = 'test_access_secret_32chars_minimum!!';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_32chars_minimum!';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.__MONGO_URI__ = uri;
  global.__MONGOMS__ = replSet;
};
