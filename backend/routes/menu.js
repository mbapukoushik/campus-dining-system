'use strict';

/**
 * routes/menu.js
 *
 * TDD §5.3 — Menu CRUD API
 *
 * Endpoints (all mounted under /api/vendors/:id/menu):
 *
 *  GET    /api/vendors/:id/menu          — Get all menu items for a vendor
 *                                          Redis cache: 2 minutes, key: 'menu:<vendorId>'
 *                                          Public — no auth required
 *
 *  POST   /api/vendors/:id/menu          — Add a new menu item (JWT + ownershipGuard)
 *                                          Invalidates menu cache on success
 *
 *  PUT    /api/vendors/:id/menu/:itemId  — Update a menu item (JWT + ownershipGuard)
 *                                          Invalidates menu cache on success
 *
 *  DELETE /api/vendors/:id/menu/:itemId  — Delete a menu item (JWT + ownershipGuard)
 *                                          If last item deleted → vendor auto-closed
 *                                          (handled by MenuItem post-hook in model)
 *                                          Invalidates menu + vendor cache on success
 *
 * NOTE: The auto-close logic when a vendor reaches 0 items is already implemented
 * as a Mongoose post-hook inside models/MenuItem.js (TDD §4.2). No duplicate logic
 * is needed here — the hook fires automatically after findOneAndDelete resolves.
 *
 * Cache invalidation strategy (TDD §5.3):
 *  Menu writes: delete 'menu:<vendorId>'
 *  On DELETE:   also delete 'vendor:<vendorId>' + 'vendors:all' so the auto-closed
 *               status is reflected immediately in vendor list responses.
 */

const express = require('express');

// This router uses mergeParams so :id from the parent vendors route is accessible.
const router = express.Router({ mergeParams: true });

const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');
const redis = require('../config/redis');
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');
const ownershipGuard = require('../middleware/ownershipGuard');

// ─── Cache helpers ────────────────────────────────────────────────────────────

const CACHE_TTL_MENU = 2 * 60; // 2 minutes (TDD §5.3)
const menuCacheKey = (vendorId) => `menu:${vendorId}`;
const vendorCacheKey = (vendorId) => `vendor:${vendorId}`;
const CACHE_KEY_ALL_VENDORS = 'vendors:all';

/**
 * Invalidate the menu cache for this vendor.
 */
async function invalidateMenuCache(vendorId) {
  try {
    await redis.del(menuCacheKey(vendorId));
  } catch (err) {
    console.error('[menu] Menu cache invalidation error:', err.message);
  }
}

/**
 * Invalidate menu AND vendor caches.
 * Called on DELETE so the auto-close status is propagated immediately.
 */
async function invalidateAllCaches(vendorId) {
  try {
    await redis.del(menuCacheKey(vendorId));
    await redis.del(vendorCacheKey(vendorId));
    await redis.del(CACHE_KEY_ALL_VENDORS);
  } catch (err) {
    console.error('[menu] Full cache invalidation error:', err.message);
  }
}

// ─── GET /api/vendors/:id/menu ────────────────────────────────────────────────
// Public — no auth required.
// Returns all menu items for the specified vendor, sorted by category then name.
// Redis cached for 2 minutes.

router.get('/', async (req, res) => {
  try {
    const vendorId = req.params.id;
    const cacheKey = menuCacheKey(vendorId);

    // 1. Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // 2. Verify vendor exists
    const vendorExists = await Vendor.exists({ _id: vendorId });
    if (!vendorExists) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // 3. Cache miss — fetch from MongoDB
    const items = await MenuItem.find({ vendor_id: vendorId })
      .sort({ category: 1, item_name: 1 })
      .lean();

    // 4. Store in Redis
    await redis.setex(cacheKey, CACHE_TTL_MENU, JSON.stringify(items));

    return res.status(200).json(items);
  } catch (err) {
    console.error('[GET /api/vendors/:id/menu] Error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve menu items' });
  }
});

// ─── POST /api/vendors/:id/menu ───────────────────────────────────────────────
// Protected: JWT + vendor role + ownership check.
// Creates a new menu item for this vendor.
// Body: { item_name, price, category, dietary_tag?, image_url?, is_sold_out? }

router.post(
  '/',
  authenticate,
  roleGuard('vendor'),
  ownershipGuard,
  async (req, res) => {
    try {
      const vendorId = req.params.id;

      const { item_name, price, category, dietary_tag, image_url, is_sold_out } = req.body;

      const item = new MenuItem({
        vendor_id: vendorId,
        item_name,
        price,
        category,
        ...(dietary_tag !== undefined && { dietary_tag }),
        ...(image_url !== undefined && { image_url }),
        ...(is_sold_out !== undefined && { is_sold_out }),
      });

      await item.save();

      // Invalidate menu cache so the new item appears immediately
      await invalidateMenuCache(vendorId);

      return res.status(201).json(item.toJSON());
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      console.error('[POST /api/vendors/:id/menu] Error:', err.message);
      return res.status(500).json({ error: 'Failed to create menu item' });
    }
  }
);

// ─── PUT /api/vendors/:id/menu/:itemId ────────────────────────────────────────
// Protected: JWT + vendor role + ownership check.
// Updates an existing menu item. Only the fields provided in the body are changed.
// Allowed: item_name, price, category, dietary_tag, image_url, is_sold_out.

router.put(
  '/:itemId',
  authenticate,
  roleGuard('vendor'),
  ownershipGuard,
  async (req, res) => {
    try {
      const vendorId = req.params.id;
      const { itemId } = req.params;

      // Whitelist updatable fields
      const allowedFields = ['item_name', 'price', 'category', 'dietary_tag', 'image_url', 'is_sold_out'];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update' });
      }

      // Find item and ensure it belongs to this vendor (prevents cross-vendor tampering)
      const item = await MenuItem.findOne({ _id: itemId, vendor_id: vendorId });
      if (!item) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      Object.assign(item, updates);
      await item.save();

      // Invalidate menu cache
      await invalidateMenuCache(vendorId);

      return res.status(200).json(item.toJSON());
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      console.error('[PUT /api/vendors/:id/menu/:itemId] Error:', err.message);
      return res.status(500).json({ error: 'Failed to update menu item' });
    }
  }
);

// ─── DELETE /api/vendors/:id/menu/:itemId ─────────────────────────────────────
// Protected: JWT + vendor role + ownership check.
// Deletes a menu item.
//
// AUTO-CLOSE: If this deletion results in 0 items for this vendor, the vendor's
// is_currently_open is automatically set to false by the Mongoose post-hook in
// models/MenuItem.js (TDD §4.2). No extra code needed here.
//
// After deletion we invalidate menu + vendor caches so the closed status is
// immediately visible in list and single-vendor responses.

router.delete(
  '/:itemId',
  authenticate,
  roleGuard('vendor'),
  ownershipGuard,
  async (req, res) => {
    try {
      const vendorId = req.params.id;
      const { itemId } = req.params;

      // Find item and ensure it belongs to this vendor
      const item = await MenuItem.findOne({ _id: itemId, vendor_id: vendorId });
      if (!item) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      // Use findOneAndDelete so the Mongoose post('findOneAndDelete') hook fires,
      // which triggers the auto-close logic in models/MenuItem.js
      await MenuItem.findOneAndDelete({ _id: itemId, vendor_id: vendorId });

      // Invalidate menu + vendor caches (vendor may now be auto-closed)
      await invalidateAllCaches(vendorId);

      return res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (err) {
      console.error('[DELETE /api/vendors/:id/menu/:itemId] Error:', err.message);
      return res.status(500).json({ error: 'Failed to delete menu item' });
    }
  }
);

module.exports = router;
