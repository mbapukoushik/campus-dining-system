'use strict';

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');
const Vendor = require('../models/Vendor');
const Review = require('../models/Review');
const AuditLog = require('../models/AuditLog');

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
// Global platform statistics for admin dashboard
router.get(
  '/stats',
  authenticate,
  roleGuard('admin'),
  async (req, res) => {
    try {
      const vendorCount = await Vendor.countDocuments();
      const reviewCount = await Review.countDocuments();
      const openVendors = await Vendor.countDocuments({ is_currently_open: true });

      return res.status(200).json({
        total_vendors: vendorCount,
        total_reviews: reviewCount,
        open_vendors: openVendors,
      });
    } catch (err) {
      console.error('[Admin Stats] Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch admin statistics' });
    }
  }
);

// ─── POST /api/admin/block-vendor/:id ─────────────────────────────────────────
// Admin blocks a vendor and logs the action
router.post(
  '/block-vendor/:id',
  authenticate,
  roleGuard('admin'),
  async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ error: 'Reason for blocking is required' });

      const vendor = await Vendor.findByIdAndUpdate(
        req.params.id,
        { is_currently_open: false },
        { new: true }
      );

      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

      // Create audit log
      await AuditLog.create({
        admin_id: req.user._id,
        action: 'BLOCK_VENDOR',
        target_type: 'VENDOR',
        target_id: vendor._id,
        reason,
      });

      return res.status(200).json({ message: 'Vendor blocked successfully', vendor });
    } catch (err) {
      console.error('[Admin Block Vendor] Error:', err.message);
      return res.status(500).json({ error: 'Failed to block vendor' });
    }
  }
);

// ─── GET /api/admin/logs ─────────────────────────────────────────────────────
// Retrieve all administrative audit logs
router.get(
  '/logs',
  authenticate,
  roleGuard('admin'),
  async (req, res) => {
    try {
      const logs = await AuditLog.find()
        .sort({ timestamp: -1 })
        .populate('admin_id', 'email')
        .lean();

      return res.status(200).json(logs);
    } catch (err) {
      console.error('[Admin Logs] Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

module.exports = router;
