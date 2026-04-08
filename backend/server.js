'use strict';

/**
 * server.js — Campus Dining & Vendor Quality Management System
 *
 * SRM University AP · Amaravati Campus
 * TDD Gold Master v3.0
 *
 * Boot order:
 *  1. Load .env via dotenv
 *  2. Connect to MongoDB (config/db.js)
 *  3. Connect to Redis   (config/redis.js)
 *  4. Initialise Passport Google OAuth (config/passport.js)
 *  5. Mount Express middleware stack
 *  6. Mount API routes
 *  7. Mount /healthz endpoint
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

const authRouter     = require('./routes/auth');
const vendorsRouter  = require('./routes/vendors');
const menuRouter     = require('./routes/menu');
const reviewsRouter  = require('./routes/reviews');
const waitTimesRouter = require('./routes/waitTimes');
const plannerRouter  = require('./routes/planner');
const adminRouter    = require('./routes/admin');
const authenticate   = require('./middleware/authenticate');

const app = express();

// ─── 2. Database ──────────────────────────────────────────────────────────────
(async () => {
  await connectDB();
})();

// ─── 3. Redis ─────────────────────────────────────────────────────────────────
// Redis singleton initialised on require — connection events logged in config/redis.js

// ─── 4. Passport ──────────────────────────────────────────────────────────────
initPassport();

// ─── 5. Express Middleware Stack ──────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ─── 6. API Routes ────────────────────────────────────────────────────────────

app.use('/api/auth',                authRouter);
app.use('/api/vendors',             vendorsRouter);
app.use('/api/vendors/:id/menu',    menuRouter);
app.use('/api/vendors/:id/reviews', reviewsRouter);
app.use('/api/vendors/:id/wait-time', waitTimesRouter);
app.use('/api/planner',             plannerRouter);
app.use('/api/admin',               adminRouter);

// ─── 7. /healthz Endpoint ─────────────────────────────────────────────────────
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

  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) health.mongodb = 'ok';
  } catch (_) {}

  try {
    const pong = await redis.ping();
    if (pong === 'PONG') health.redis = 'ok';
  } catch (_) {}

  const statusCode = health.mongodb === 'ok' && health.redis === 'ok' ? 200 : 503;
  return res.status(statusCode).json(health);
};

app.get(
  '/healthz',
  (req, res, next) => {
    const isLocal = req.ip === '127.0.0.1' || req.ip === '::1';
    if (isLocal) return next();
    return requireAdminAuth[0](req, res, () => requireAdminAuth[1](req, res, next));
  },
  healthzController
);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err.message);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── 8. Start HTTP Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Campus Dining API running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] /healthz protected (localhost or Admin JWT only)`);
});

module.exports = app;
