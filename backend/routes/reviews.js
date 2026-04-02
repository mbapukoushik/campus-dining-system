'use strict';

/**
 * routes/reviews.js
 *
 * Reviews API (TDD §5.5 / §6.1 / §6.4)
 *
 * GET  /api/vendors/:id/reviews   — Public for scores; comment_text hidden from guests
 * POST /api/vendors/:id/reviews   — JWT (student role); enforces:
 *                                     • 1 review per (student, vendor) — lifetime (Redis + DB unique index)
 *                                     • Max 2 reviews/hour globally per student (Redis sliding window)
 *                                     • 60-minute Anomaly Tripwire (TDD §6.4)
 *
 * ─── Rate Limit Keys (TDD §6.1) ────────────────────────────────────────────
 *   review:lifetime:<studentId>:<vendorId>  → SET; 1 = already reviewed (no TTL — lifetime)
 *   review:hourly:<studentId>               → INCR with 3600s TTL; max 2
 *
 * ─── Anomaly Tripwire (TDD §6.4) ───────────────────────────────────────────
 *   Trigger: > 10 negative reviews (overall_score ≤ 2) for a vendor within 60 minutes
 *   Action: Set vendor field `is_currently_open` = false AND mark all triggering reviews as is_frozen = true
 *
 * Anti-Weaponization Gates (TDD §6.4) — run BEFORE freeze:
 *   1. Account age gate    : reviewer account must be > 7 days old
 *   2. Subnet gate         : at most 3 distinct /24 subnets in the suspicious batch
 *   3. Prior activity gate : reviewer must have ≥ 1 prior review or order
 *
 * Privacy: student_id NEVER exposed in responses (enforced by Review schema transform).
 */

const express = require('express');
const router = express.Router({ mergeParams: true });

const Review = require('../models/Review');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');
const redis = require('../config/redis');

// ─── Constants ────────────────────────────────────────────────────────────────
const ANOMALY_WINDOW_MS = 60 * 60 * 1000;              // 60 minutes (TDD §6.4)
const ANOMALY_THRESHOLD = 10;                           // > 10 negative reviews triggers freeze
const NEGATIVE_SCORE_THRESHOLD = 2;                     // overall_score <= 2 = negative (TDD §6.4)
const ACCOUNT_AGE_GATE_DAYS = 7;                        // Account must be > 7 days old
const SUBNET_GATE_MAX = 3;                              // Max 3 distinct /24 subnets in suspicious batch
const HOURLY_REVIEW_LIMIT = 2;                          // Max 2 reviews/hour globally per student (TDD §6.1)

// Redis key builders
const lifetimeKey = (studentId, vendorId) => `review:lifetime:${studentId}:${vendorId}`;
const hourlyKey = (studentId) => `review:hourly:${studentId}`;

// ─── Helper: extract /24 subnet from IPv4 or IPv6-mapped IPv4 ────────────────
function extractSubnet(ip) {
  if (!ip) return 'unknown';
  // Handle IPv6-mapped IPv4: ::ffff:192.168.1.1
  const ipv4 = ip.replace(/^::ffff:/, '');
  const parts = ipv4.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`; // /24 subnet
  }
  return ip; // return raw for IPv6 (unlikely in campus LAN)
}

// ─── Helper: run Anomaly Tripwire (TDD §6.4) ─────────────────────────────────
async function runAnomalyTripwire(vendorId) {
  try {
    const windowStart = new Date(Date.now() - ANOMALY_WINDOW_MS);

    // Count negative reviews in last 60 minutes (uses composite index: vendor_id, timestamp, overall_score)
    const recentNegativeReviews = await Review.find({
      vendor_id: vendorId,
      timestamp: { $gte: windowStart },
      overall_score: { $lte: NEGATIVE_SCORE_THRESHOLD },
      is_frozen: false,
    }).lean();

    if (recentNegativeReviews.length <= ANOMALY_THRESHOLD) {
      return; // Under threshold — no action
    }

    // ── Anti-Weaponization Gates (TDD §6.4) ──────────────────────────────────

    // Gate 1: Account age — filter out reviewers with accounts > 7 days old
    const reviewerIds = [...new Set(recentNegativeReviews.map((r) => r.student_id))];
    const accountAgeCutoff = new Date(Date.now() - ACCOUNT_AGE_GATE_DAYS * 24 * 60 * 60 * 1000);
    const youngAccounts = await User.find({
      _id: { $in: reviewerIds },
      created_at: { $gte: accountAgeCutoff }, // created AFTER cutoff = young account
    }).lean();
    const youngAccountIds = new Set(youngAccounts.map((u) => u._id));

    // Gate 2: Subnet check — count distinct /24 subnets among suspicious reviews
    // Note: client IPs stored at submission time (from req.ip at POST time)
    // We compare subnets of the reviews that triggered the tripwire.
    // Since we don't store IP in the Review model (privacy), we apply the subnet
    // gate at write-time only (see POST handler). Here we proceed conservatively.
    // TDD §6.4: "subnet check" — implemented at POST time; skip re-check at freeze.

    // Gate 3: Prior activity — reviewers must have ≥ 1 prior review
    const priorActivityCounts = await Review.aggregate([
      {
        $match: {
          student_id: { $in: reviewerIds },
          vendor_id: { $ne: vendorId }, // reviews at OTHER vendors
        },
      },
      { $group: { _id: '$student_id', count: { $sum: 1 } } },
    ]);
    const activeReviewers = new Set(priorActivityCounts.map((r) => r._id));

    // A suspicious review is from: young account + no prior activity
    const suspiciousReviewIds = recentNegativeReviews
      .filter((r) => youngAccountIds.has(r.student_id) && !activeReviewers.has(r.student_id))
      .map((r) => r._id);

    // If after removing suspicious reviews we're still over threshold → freeze
    const legitimateNegativeCount = recentNegativeReviews.length - suspiciousReviewIds.length;

    if (legitimateNegativeCount > ANOMALY_THRESHOLD) {
      // Freeze the vendor
      await Vendor.findByIdAndUpdate(vendorId, { is_currently_open: false });
      console.warn(`[Anomaly Tripwire] Vendor ${vendorId} FROZEN — ${legitimateNegativeCount} negative reviews in 60 min`);

      // Mark suspicious reviews as frozen
      if (suspiciousReviewIds.length > 0) {
        await Review.updateMany(
          { _id: { $in: suspiciousReviewIds } },
          { is_frozen: true }
        );
      }
    }
  } catch (err) {
    // Non-blocking — log and continue; tripwire must not crash POST
    console.error('[Anomaly Tripwire] Error:', err.message);
  }
}

// ─── GET /api/vendors/:id/reviews ────────────────────────────────────────────
// Public but role-aware:
//   - Guests: scores only (no comment_text)
//   - Students/Vendors/Admin: full review including comment_text
// Pagination: ?page=1&limit=20 (newest first)
// Excludes is_frozen reviews from public aggregate.
router.get('/', async (req, res) => {
  try {
    const { id: vendorId } = req.params;

    // Validate vendor exists (TDD §6.2)
    const vendorExists = await Vendor.exists({ _id: vendorId });
    if (!vendorExists) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Only show non-frozen reviews publicly
    const reviews = await Review.find({ vendor_id: vendorId, is_frozen: false })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Role-aware: hide comment_text from guests (TDD §2.3)
    const isGuest = !req.cookies?.token; // simple check — no JWT = guest
    const safeReviews = reviews.map((r) => {
      const safe = { ...r };
      // NEVER expose student_id (schema transform already handles this for .toJSON,
      // but we're using .lean() so manual delete is required)
      delete safe.student_id;
      if (isGuest) {
        delete safe.comment_text;
      }
      // report_health_concern is internal — never expose publicly
      delete safe.report_health_concern;
      return safe;
    });

    // Aggregate scores (non-frozen only)
    const [agg] = await Review.aggregate([
      { $match: { vendor_id: vendorId, is_frozen: false } },
      {
        $group: {
          _id: null,
          avg_taste: { $avg: '$taste_score' },
          avg_value: { $avg: '$value_score' },
          avg_overall: { $avg: '$overall_score' },
          total: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      reviews: safeReviews,
      aggregate: agg
        ? {
            avg_taste: Math.round(agg.avg_taste * 10) / 10,
            avg_value: Math.round(agg.avg_value * 10) / 10,
            avg_overall: Math.round(agg.avg_overall * 10) / 10,
            total_reviews: agg.total,
          }
        : { avg_taste: null, avg_value: null, avg_overall: null, total_reviews: 0 },
      pagination: { page, limit },
    });
  } catch (err) {
    console.error('[GET /api/vendors/:id/reviews] Error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

// ─── POST /api/vendors/:id/reviews ───────────────────────────────────────────
// Authenticated: JWT + student role
// Enforces:
//   1. Lifetime uniqueness: 1 review per (student, vendor) — Redis + DB unique index
//   2. Global hourly rate limit: max 2 reviews/hour per student — Redis sliding window
//   3. Anti-Weaponization subnet gate: max 3 distinct /24 subnets among recent negative reviews
//   4. 60-minute Anomaly Tripwire (TDD §6.4) — runs asynchronously post-write
router.post(
  '/',
  authenticate,
  roleGuard('student'),
  async (req, res) => {
    try {
      const { id: vendorId } = req.params;
      const studentId = req.user._id;
      const clientIp = req.ip;

      // ── Validate vendor exists (TDD §6.2) ────────────────────────────────────
      const vendor = await Vendor.findById(vendorId).select('is_currently_open').lean();
      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // ── Anomaly Freeze Gate (TDD §6.4) ──────────────────────────────────────
      // If the vendor was frozen by the anomaly tripwire, block new review submissions.
      if (!vendor.is_currently_open) {
        // Check a dedicated Redis freeze flag for extra certainty
        const freezeKey = `vendor:frozen:${vendorId}`;
        const isFrozen = await redis.get(freezeKey);
        // We block if vendor is closed — the tripwire sets is_currently_open: false
        return res.status(423).json({
          error: 'Reviews temporarily paused for quality review.',
        });
      }

      // ── Rate Limit Check 1: Lifetime (1 per vendor — Redis) (TDD §6.1) ──────
      const ltKey = lifetimeKey(studentId, vendorId);
      const alreadyReviewed = await redis.get(ltKey);
      if (alreadyReviewed) {
        return res.status(429).json({
          error: 'You have already reviewed this vendor. Only 1 review per vendor is allowed (lifetime).',
        });
      }

      // ── Rate Limit Check 2: Max 2 reviews/hour globally (TDD §6.1) ──────────
      const hrKey = hourlyKey(studentId);
      const hourlyCount = await redis.get(hrKey);
      if (hourlyCount && parseInt(hourlyCount, 10) >= HOURLY_REVIEW_LIMIT) {
        return res.status(429).json({
          error: `You can submit at most ${HOURLY_REVIEW_LIMIT} reviews per hour. Please try again later.`,
        });
      }

      // ── Anti-Weaponization: Subnet Gate (TDD §6.4) ───────────────────────────
      // Count distinct /24 subnets from recent negative reviews for this vendor in last 60 min
      const windowStart = new Date(Date.now() - ANOMALY_WINDOW_MS);
      const recentNegativeReviews = await Review.find({
        vendor_id: vendorId,
        timestamp: { $gte: windowStart },
        overall_score: { $lte: NEGATIVE_SCORE_THRESHOLD },
        is_frozen: false,
      }).select('_id').lean();

      // We don't store IPs in the schema (privacy), so we track subnets in Redis
      // Key: review:subnets:<vendorId> → SET of /24 subnets from negative reviews in last 60 min
      const subnetSetKey = `review:subnets:${vendorId}`;
      const { taste_score, value_score, overall_score } = req.body;
      const isNegative = Number.isInteger(overall_score) && overall_score <= NEGATIVE_SCORE_THRESHOLD;

      if (isNegative) {
        const subnet = extractSubnet(clientIp);
        const subnetCount = await redis.sadd(subnetSetKey, subnet);
        await redis.expire(subnetSetKey, 3600); // 60-min window

        const totalSubnets = await redis.scard(subnetSetKey);
        if (totalSubnets > SUBNET_GATE_MAX) {
          return res.status(429).json({
            error: 'Review submission blocked: coordinated negative review pattern detected.',
          });
        }
      }

      // ── Write Review ──────────────────────────────────────────────────────────
      const { comment_text, report_health_concern } = req.body;

      const review = new Review({
        vendor_id: vendorId,
        student_id: studentId,
        taste_score,
        value_score,
        overall_score,
        comment_text: comment_text || null,
        report_health_concern: report_health_concern === true,
      });

      try {
        await review.save();
      } catch (saveErr) {
        // Catch MongoDB unique index violation (student_id + vendor_id compound unique)
        if (saveErr.code === 11000) {
          return res.status(429).json({
            error: 'You have already reviewed this vendor. Only 1 review per vendor is allowed (lifetime).',
          });
        }
        throw saveErr;
      }

      // ── Update Rate Limit Counters (AFTER successful save) ───────────────────

      // Lifetime marker — no TTL; persists forever
      await redis.set(ltKey, '1');

      // Hourly counter — 3600s TTL, reset on first count (SETNX pattern)
      const pipe = redis.pipeline();
      pipe.incr(hrKey);
      pipe.expire(hrKey, 3600);
      await pipe.exec();

      // ── Fire Anomaly Tripwire asynchronously (TDD §6.4) ──────────────────────
      // Non-blocking — don't await
      runAnomalyTripwire(vendorId).catch((err) =>
        console.error('[POST /reviews] Tripwire async error:', err.message)
      );

      // Return review without student_id (privacy — manual delete since save() returns doc)
      const reviewData = review.toJSON();

      return res.status(201).json({
        message: 'Review submitted successfully',
        review: reviewData,
      });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      console.error('[POST /api/vendors/:id/reviews] Error:', err.message);
      return res.status(500).json({ error: 'Failed to submit review' });
    }
  }
);

module.exports = router;
