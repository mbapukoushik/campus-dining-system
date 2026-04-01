'use strict';

const Vendor = require('../models/Vendor');

/**
 * middleware/ownershipGuard.js
 *
 * Server-side ownership check for ALL vendor write endpoints (TDD §6.3).
 * Mandatory on: PUT /api/vendors/:id, POST/PUT/DELETE menu items, toggle-open.
 *
 * Exact implementation from TDD §6.3:
 *   const vendor = await Vendor.findById(req.params.id);
 *   if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
 *   if (vendor.owner_id !== req.user._id)
 *     return res.status(403).json({ error: 'Forbidden' });
 *   req.vendor = vendor;
 *   next();
 *
 * For menu item routes the :id param is still the vendor ID (passed in the URL
 * as /api/vendors/:id/menu/...), so the same middleware works without changes.
 *
 * Usage:
 *   router.put('/vendors/:id', authenticate, roleGuard('vendor'), ownershipGuard, handler);
 */
const ownershipGuard = async (req, res, next) => {
  try {
    // req.vendor may already be populated by a previous middleware; skip re-fetch.
    const vendor = req.vendor || (await Vendor.findById(req.params.id));

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (vendor.owner_id !== req.user._id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Attach resolved vendor to request — avoids re-fetching in route handler
    req.vendor = vendor;
    return next();
  } catch (err) {
    console.error('[ownershipGuard] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = ownershipGuard;
