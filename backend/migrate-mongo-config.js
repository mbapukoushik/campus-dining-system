'use strict';

/**
 * migrate-mongo-config.js
 *
 * Configuration for migrate-mongo schema migration tool (TDD §7.1).
 * NEVER hardcode MONGO_URI or credentials here (TDD §1.1).
 * Reads all connection details from process.env via dotenv.
 */
require('dotenv').config();

const config = {
  mongodb: {
    // NEVER hardcode — loaded from .env (TDD §1.1)
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/campus-dining?replicaSet=rs0',
    options: {
      maxPoolSize: 10, // Lower pool for migration runs (not a hot path)
    },
  },

  // The migrations directory path (TDD §1.3)
  migrationsDir: 'migrations',

  // The MongoDB collection that stores migration state
  changelogCollectionName: 'changelog',

  // Use Node.js ESM or CJS module system for migration files
  migrationFileExtension: '.js',

  // Use UTC timestamps in migration filenames
  useFileHash: false,
};

module.exports = config;
