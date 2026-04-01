'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * middleware/authenticate.js
 *
 * JWT authentication middleware.
 * Reads the token from the httpOnly cookie set at login (TDD §5).
 * Resolves the user role before passing control to route handlers.
 *
 * TDD §5: "All authenticated endpoints must verify the JWT and resolve
 *          the user role before processing."
 *
 * Usage:
 *   router.post('/some-route', authenticate, roleGuard('student'), handler);
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify and decode — secret always from env (TDD §1.1)
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Resolve full user document to get current role (handles role changes)
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // TDD §1.1: NEVER expose student_id in any API response
    // Attach user to req for downstream middleware/handlers
    req.user = {
      _id: user._id,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      created_at: user.created_at,
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('[authenticate] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = authenticate;
