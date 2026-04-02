'use strict';

/**
 * routes/vendors.js
 *
 * TDD §5.2 — Vendor Operations API
 *
 * Endpoints:
 *  GET  /api/vendors            — List all vendors (includes is_within_hours virtual)
 *                                 Redis cache: 5 minutes, key: 'vendors:all'
 *  GET  /api/vendors/:id        — Get a single vendor by ID
 *  PUT  /api/vendors/:id        — Update vendor info (JWT + ownershipGuard)
 *                                 Invalidates Redis cache on success
 *  POST /api/vendors/:id/toggle-open — Flip is_currently_open (JWT + ownershipGuard)
 *                                      Invalidates Redis cache on success
 *
 * All write routes require:
 *  1. authenticate   — verifies JWT from httpOnly cookie
 *  2. roleGuard      — only role==='vendor' can write
 *  3. ownershipGuard — req.user._id must match vendor.owner_id
 *
 * Cache invalidation strategy (TDD §5.2):
 *  On any successful write, delete BOTH the vendor list cache AND the
 *  per-vendor cache so clients always see fresh data.
 */

const express = require('express');
const router = express.Router();

const Vendor = require('../models/Vendor');
const redis = require('../config/redis');
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');
const ownershipGuard = require('../middleware/ownershipGuard');

// ─── Cache helpers ────────────────────────────────────────────────────────────

const CACHE_TTL_VENDORS_LIST = 5 * 60; // 5 minutes (TDD §5.2)
const CACHE_KEY_ALL = 'vendors:all';
const vendorCacheKey = (id) => `vendor:${id}`;

/**
 * Invalidate both the list cache and the individual vendor cache.
 * Called after every successful write operation.
 */
async function invalidateVendorCache(vendorId) {
  try {
    await redis.del(CACHE_KEY_ALL);
    if (vendorId) await redis.del(vendorCacheKey(vendorId));
  } catch (err) {
    // Cache invalidation failure must NOT crash the request (TDD §5.2)
    console.error('[vendors] Cache invalidation error:', err.message);
  }
}

// ─── GET /api/vendors ─────────────────────────────────────────────────────────
// Public endpoint — no auth required.
// Returns all vendors as JSON; includes the is_within_hours virtual.
// Cached for 5 minutes in Redis.

router.get('/', async (req, res) => {
  try {
    // 1. Try cache first
    const cached = await redis.get(CACHE_KEY_ALL);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // 2. Cache miss — fetch from MongoDB
    // .lean() skips Mongoose toJSON transforms, so manually .toObject() is needed;
    // use find() without .lean() to preserve virtuals like is_within_hours.
    const vendors = await Vendor.find({}).sort({ stall_name: 1 });

    // Serialise to plain objects so virtuals are included
    const vendorData = vendors.map((v) => v.toJSON());

    // 3. Store in cache
    await redis.setex(CACHE_KEY_ALL, CACHE_TTL_VENDORS_LIST, JSON.stringify(vendorData));

    return res.status(200).json(vendorData);
  } catch (err) {
    console.error('[GET /api/vendors] Error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve vendors' });
  }
});

// ─── GET /api/vendors/:id ─────────────────────────────────────────────────────
// Public endpoint — no auth required.

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = vendorCacheKey(id);

    // 1. Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // 2. Cache miss — fetch from MongoDB
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendorData = vendor.toJSON();

    // Cache individual vendor for the same duration as the list
    await redis.setex(cacheKey, CACHE_TTL_VENDORS_LIST, JSON.stringify(vendorData));

    return res.status(200).json(vendorData);
  } catch (err) {
    console.error('[GET /api/vendors/:id] Error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve vendor' });
  }
});

// ─── PUT /api/vendors/:id ─────────────────────────────────────────────────────
// Protected: JWT + vendor role + ownership check.
// Allowed fields: stall_name, location_tag, operating_hours, is_currently_open.
// Returns the updated vendor document.

router.put(
  '/:id',
  authenticate,
  roleGuard('vendor'),
  ownershipGuard,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Whitelist updatable fields to prevent mass assignment (TDD §6)
      const allowedFields = ['stall_name', 'location_tag', 'operating_hours', 'is_currently_open'];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update' });
      }

      // req.vendor is already attached by ownershipGuard
      const vendor = req.vendor;
      Object.assign(vendor, updates);
      await vendor.save();

      // Invalidate caches
      await invalidateVendorCache(id);

      return res.status(200).json(vendor.toJSON());
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      console.error('[PUT /api/vendors/:id] Error:', err.message);
      return res.status(500).json({ error: 'Failed to update vendor' });
    }
  }
);

// ─── POST /api/vendors/:id/toggle-open ───────────────────────────────────────
// Protected: JWT + vendor role + ownership check.
// Flips the is_currently_open boolean.
// Returns: { is_currently_open: <new value> }

router.post(
  '/:id/toggle-open',
  authenticate,
  roleGuard('vendor'),
  ownershipGuard,
  async (req, res) => {
    try {
      const { id } = req.params;

      // req.vendor is already attached by ownershipGuard
      const vendor = req.vendor;
      vendor.is_currently_open = !vendor.is_currently_open;
      await vendor.save();

      // Invalidate caches
      await invalidateVendorCache(id);

      return res.status(200).json({
        message: `Vendor is now ${vendor.is_currently_open ? 'open' : 'closed'}`,
        is_currently_open: vendor.is_currently_open,
      });
    } catch (err) {
      console.error('[POST /api/vendors/:id/toggle-open] Error:', err.message);
      return res.status(500).json({ error: 'Failed to toggle vendor status' });
    }
  }
);

module.exports = router;
