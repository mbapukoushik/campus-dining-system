'use strict';

const mongoose = require('mongoose');

/**
 * config/db.js
 *
 * MongoDB connection with:
 *  - maxPoolSize: 100   (TDD §3.2 — 3,000 user load target)
 *  - readPreference: 'secondaryPreferred'  (TDD §3.2 — all GET queries route to replica)
 *
 * NEVER hardcode MONGO_URI here — always read from process.env (TDD §1.1)
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 100,
      readPreference: 'secondaryPreferred', // all reads routed to secondary replica
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting reconnect...');
    });
  } catch (err) {
    console.error('[MongoDB] Initial connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
