'use strict';

const Redis = require('ioredis');

/**
 * config/redis.js
 *
 * Initializes the ioredis client.
 * NEVER hardcode REDIS_URL — always read from process.env (TDD §1.1)
 *
 * The singleton `redis` instance is exported and reused across all modules
 * (services, middleware, route handlers) to share a single connection pool.
 */
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('ready', () => {
  console.log('[Redis] Ready to accept commands');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('close', () => {
  console.warn('[Redis] Connection closed');
});

redis.on('reconnecting', (delay) => {
  console.warn(`[Redis] Reconnecting in ${delay}ms...`);
});

module.exports = redis;
