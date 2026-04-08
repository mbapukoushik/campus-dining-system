'use strict';

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');
const User = require('../models/User');

const router = express.Router();

// ─── Rate Limiter: 5 attempts / minute per IP (TDD §6.1) ─────────────────────
// Uses Redis store — in-memory stores are NOT acceptable (TDD §6.1)
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a minute.' },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
});


// ─── POST /api/auth/google ────────────────────────────────────────────────────
// Initiates the Google OAuth2 flow (TDD §5.1)
router.post(
  '/google',
  authRateLimiter,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Also support GET for the browser redirect that Google triggers
router.get(
  '/google',
  authRateLimiter,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// ─── GET /api/auth/google/callback ───────────────────────────────────────────
// OAuth callback handler (TDD §5.1)
//
// Domain Validation (TDD §5.1 — MANDATORY):
//   const domain = process.env.UNIVERSITY_EMAIL_DOMAIN;
//   if (!profile.email.endsWith(domain)) return 403
//
// This is enforced INSIDE the Passport strategy verify callback (see passport.js config),
// AND re-validated here as a defence-in-depth measure.
router.get(
  '/google/callback',
  authRateLimiter,
  passport.authenticate('google', {
    session: false,       // We use stateless JWT, not sessions
    failureRedirect: '/api/auth/failure',
  }),
  async (req, res) => {
    try {
      // req.user is set by Passport after a successful verify callback
      const user = req.user;

      // Defence-in-depth domain check (TDD §5.1)
      // NEVER hardcode the domain — always read from process.env (TDD §1.1)
      const domain = process.env.UNIVERSITY_EMAIL_DOMAIN;
      if (!domain) {
        console.error('[Auth] UNIVERSITY_EMAIL_DOMAIN env var is not set');
        return res.status(500).json({ error: 'Server misconfiguration' });
      }

      if (!user.email.endsWith(domain)) {
        return res.status(403).json({ error: 'University email required' });
      }

      // Sign a JWT — secret NEVER hardcoded (TDD §1.1)
      const token = jwt.sign(
        {
          sub: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Deliver as an httpOnly cookie (TDD §5 — "Authentication uses JWT (httpOnly cookie)")
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
      });

      // Redirect back to the React frontend — NOT a JSON response.
      // The browser navigated here directly during OAuth; we must send it home.
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(frontendUrl);
    } catch (err) {
      console.error('[Auth] Callback error:', err.message);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
  }
);

// ─── GET /api/auth/failure ───────────────────────────────────────────────────
// Passport redirects here on OAuth failure
router.get('/failure', (_req, res) => {
  return res.status(401).json({ error: 'Google authentication failed' });
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
// Clears the session cookie (TDD §5.1)
// Requires JWT (caller must be authenticated — middleware applied in server.js)
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.status(200).json({ message: 'Logged out successfully' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Returns current user info from JWT cookie
const authenticate = require('../middleware/authenticate');
router.get('/me', authenticate, (req, res) => {
  return res.status(200).json({
    user: {
      email: req.user.email,
      role: req.user.role,
      is_verified: req.user.is_verified,
    }
  });
});

module.exports = router;
