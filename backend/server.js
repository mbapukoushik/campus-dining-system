'use strict';

/**
 * server.js — Campus Dining & Vendor Quality Management System
 *
 * SRM University AP · Amaravati Campus
 * TDD Gold Master v3.0
 *
 * Boot order:
 *  1. Load .env via dotenv
 *  2. Connect to MongoDB (config/db.js)      — pool 100, secondaryPreferred
 *  3. Connect to Redis   (config/redis.js)   — ioredis singleton
 *  4. Initialise Passport Google OAuth       (config/passport.js)
 *  5. Mount Express middleware stack
 *  6. Mount API routes
 *  7. Mount /healthz endpoint                (TDD §6.5 / §7.4)
 *  8. Start HTTP server
 *
 * ALL env-specific values read from process.env — NEVER hardcoded (TDD §1.1).
 */

// ─── 1. Environment ───────────────────────────────────────────────────────────
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

const connectDB = require('./config/db');
const redis = require('./config/redis');
const initPassport = require('./config/passport');

const authRouter    = require('./routes/auth');
const vendorsRouter = require('./routes/vendors');
const menuRouter    = require('./routes/menu');
const reviewsRouter = require('./routes/reviews');
const waitTimesRouter = require('./routes/waitTimes');
const plannerRouter = require('./routes/planner');
const authenticate  = require('./middleware/authenticate');

const app = express();

// ─── 2 & 3. Database + Redis ─────────────────────────────────────────────────
(async () => {
  await connectDB();
})();

// Redis is initialised on require (singleton in config/redis.js)
// Connection events are logged there.

// ─── 4. Passport ─────────────────────────────────────────────────────────────
initPassport();

// ─── 5. Express Middleware Stack ─────────────────────────────────────────────

// CORS — tighten origin in production via env var
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // Required for cross-origin httpOnly cookie
  })
);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser — needed to read the JWT httpOnly cookie
app.use(cookieParser());

// Express session — required by Passport even when using stateless JWT
// for the OAuth redirect dance (session: false on passport.authenticate calls
// means we don't persist the user in session, but the middleware is required)
app.use(
  session({
    // Secret NEVER hardcoded (TDD §1.1)
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 min — only for OAuth handshake
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// ─── 6. API Routes ───────────────────────────────────────────────────────────

// Auth: POST /api/auth/google, GET /api/auth/google/callback, POST /api/auth/logout
app.use('/api/auth', authRouter);

// Vendor Operations (TDD §5.2) — GET public; write routes: JWT + ownershipGuard
app.use('/api/vendors', vendorsRouter);

// Menu CRUD (TDD §5.3) — nested under vendor; GET public; write: JWT + ownershipGuard
app.use('/api/vendors/:id/menu', menuRouter);

// Reviews (TDD §5.5 / §6.1 / §6.4) — GET public; POST: JWT + student role + rate limits
app.use('/api/vendors/:id/reviews', reviewsRouter);

// Wait Times (TDD §5.6 / §2.4) — GET public; POST: JWT + student role + 30-min rate limit
app.use('/api/vendors/:id/wait-time', waitTimesRouter);

// Budget Planner (TDD §5.4 / §2.2) — POST: JWT required; Affordability Algorithm v2
app.use('/api/planner', plannerRouter);

// ─── 7. /healthz Endpoint (TDD §6.5 / §7.4) ──────────────────────────────────
//
// Access control (TDD §6.5):
//   Allow: localhost (internal monitoring — UptimeRobot internal IP)

//   Allow: authenticated JWT + admin role
//   Deny: all other callers
//
// Response: { node, mongodb, redis, uptime_seconds }

const requireAdminAuth = [
  authenticate,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
  },
];

const healthzController = async (_req, res) => {
  const health = {
    node: 'ok',
    mongodb: 'error',
    redis: 'error',
    uptime_seconds: Math.floor(process.uptime()),
  };

  // Check MongoDB
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      health.mongodb = 'ok';
    }
  } catch (_) {
    // remains 'error'
  }

  // Check Redis
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      health.redis = 'ok';
    }
  } catch (_) {
    // remains 'error'
  }

  const statusCode =
    health.mongodb === 'ok' && health.redis === 'ok' ? 200 : 503;

  return res.status(statusCode).json(health);
};

// TDD §6.5 exact pattern:
app.get(
  '/healthz',
  (req, res, next) => {
    const isLocal = req.ip === '127.0.0.1' || req.ip === '::1';
    if (isLocal) return next(); // allow internal monitoring
    return requireAdminAuth[0](req, res, () =>
      requireAdminAuth[1](req, res, next)
    ); // else require JWT + admin role
  },
  healthzController
);

// ─── Global Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err.message);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── 8. Start HTTP Server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Campus Dining API running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] /healthz protected (localhost or Admin JWT only)`);
});

module.exports = app; // export for testing
