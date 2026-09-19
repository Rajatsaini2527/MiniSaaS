'use strict';

module.exports = async function globalTeardown() {
  if (global.__MONGOMS__) {
    await global.__MONGOMS__.stop();
  }
};
