'use strict';

/**
 * middleware/roleGuard.js
 *
 * Role-based access control middleware (TDD §2.1).
 * Returns a configured middleware function that allows only the specified role(s).
 *
 * Usage:
 *   router.post('/reviews', authenticate, roleGuard('student'), handler);
 *   router.get('/admin/flags', authenticate, roleGuard('admin', 'support'), handler);
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden — requires one of: [${allowedRoles.join(', ')}]`,
      });
    }

    return next();
  };
};

module.exports = roleGuard;
