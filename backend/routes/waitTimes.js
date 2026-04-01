'use strict';

/**
 * routes/waitTimes.js
 *
 * Wait Time Reporting API (TDD §2.4 / §5.6 / §6.1)
 *
 * GET  /api/vendors/:id/wait-time   — Public; returns quorum-gated average
 * POST /api/vendors/:id/wait-time   — JWT (student); enforces 1 report / 30 min per (student, vendor)
 *
 * ─── Quorum Logic (TDD §2.4) ────────────────────────────────────────────────
 *   < 3 distinct student reports  → { confirmed: false, report_count: N }
 *   ≥ 3 distinct student reports  → { confirmed: true, average_minutes: N (Math.round) }
 *   Only non-expired reports count — TTL index on WaitTime.timestamp auto-deletes after 20 min.
 *
 * ─── Rate Limit (TDD §2.4 / §6.1) ──────────────────────────────────────────
 *   1 report per (student_id, vendor_id) per 30-minute rolling window.
 *   Enforced via Redis: SETNX key with 1800s TTL.
 *   Redis key: wait:rl:<studentId>:<vendorId>
 *
 * Privacy: student_id NEVER exposed in response (schema transform handles this).
 */

const express = require('express');
const router = express.Router({ mergeParams: true });

const WaitTime = require('../models/WaitTime');
const Vendor = require('../models/Vendor');
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');
const redis = require('../config/redis');

const RATE_LIMIT_WINDOW_SECONDS = 30 * 60; // 30 minutes (TDD §2.4)
const QUORUM_THRESHOLD = 3;                // Minimum distinct reporters for confirmed result

// Redis key for rate limiting
const waitRateLimitKey = (studentId, vendorId) => `wait:rl:${studentId}:${vendorId}`;

// ─── GET /api/vendors/:id/wait-time ──────────────────────────────────────────
// Public — no authentication required.
// Returns quorum-gated wait time average from non-expired WaitTime documents.
// TTL index on WaitTime.timestamp ensures records >20 min are auto-purged from MongoDB.
router.get('/', async (req, res) => {
  try {
    const { id: vendorId } = req.params;

    // Validate vendor exists (TDD §6.2)
    const vendorExists = await Vendor.exists({ _id: vendorId });
    if (!vendorExists) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Fetch all non-expired reports for this vendor.
    // The TTL index on timestamp (expireAfterSeconds: 1200) auto-purges
    // records older than 20 minutes — MongoDB handles the cleanup.
    const reports = await WaitTime.find({ vendor_id: vendorId })
      .select('student_id reported_minutes timestamp')
      .lean();

    // Count DISTINCT student reporters
    const distinctStudents = new Set(reports.map((r) => r.student_id));
    const reportCount = distinctStudents.size;

    if (reportCount < QUORUM_THRESHOLD) {
      // Below quorum — do not reveal the average (TDD §2.4)
      return res.status(200).json({
        confirmed: false,
        report_count: reportCount,
        message: `Wait time not yet confirmed. Need at least ${QUORUM_THRESHOLD} independent reports.`,
      });
    }

    // ≥ 3 distinct reporters — return rounded average
    const total = reports.reduce((sum, r) => sum + r.reported_minutes, 0);
    const average_minutes = Math.round(total / reports.length);

    return res.status(200).json({
      confirmed: true,
      average_minutes,
      report_count: reportCount,
    });
  } catch (err) {
    console.error('[GET /api/vendors/:id/wait-time] Error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve wait time data' });
  }
});

// ─── POST /api/vendors/:id/wait-time ─────────────────────────────────────────
// Authenticated: JWT + student role
// Enforces 1 report per (student, vendor) per 30-minute rolling window via Redis.
router.post(
  '/',
  authenticate,
  roleGuard('student'),
  async (req, res) => {
    try {
      const { id: vendorId } = req.params;
      const studentId = req.user._id;

      // ── Validate vendor exists (TDD §6.2) ──────────────────────────────────
      const vendorExists = await Vendor.exists({ _id: vendorId });
      if (!vendorExists) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // ── Rate Limit: 1 report / 30 min per (student, vendor) (TDD §2.4) ─────
      const rlKey = waitRateLimitKey(studentId, vendorId);
      const alreadyReported = await redis.get(rlKey);
      if (alreadyReported) {
        return res.status(429).json({
          error: 'You can only report wait time once per 30 minutes for this vendor.',
        });
      }

      // ── Validate reported_minutes ─────────────────────────────────────────────
      const { reported_minutes } = req.body;
      if (reported_minutes === undefined || reported_minutes === null) {
        return res.status(400).json({ error: 'reported_minutes is required' });
      }
      if (!Number.isInteger(Number(reported_minutes)) || Number(reported_minutes) <= 0) {
        return res.status(400).json({ error: 'reported_minutes must be a positive integer' });
      }

      // ── Write WaitTime record ─────────────────────────────────────────────────
      const record = new WaitTime({
        vendor_id: vendorId,
        student_id: studentId,
        reported_minutes: Number(reported_minutes),
      });
      await record.save();

      // ── Set Rate Limit in Redis (AFTER successful save) ───────────────────────
      await redis.setex(rlKey, RATE_LIMIT_WINDOW_SECONDS, '1');

      // Return without student_id (schema transform handles it for toJSON; manual for lean)
      return res.status(201).json({
        message: 'Wait time reported successfully.',
        record: {
          _id: record._id,
          vendor_id: record.vendor_id,
          reported_minutes: record.reported_minutes,
          timestamp: record.timestamp,
        },
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      console.error('[POST /api/vendors/:id/wait-time] Error:', err.message);
      return res.status(500).json({ error: 'Failed to report wait time' });
    }
  }
);

module.exports = router;
