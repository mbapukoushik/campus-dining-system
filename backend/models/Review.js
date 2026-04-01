'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * models/Review.js
 *
 * TDD §4.4 — Reviews collection
 *
 * Key rules:
 *  - _id: UUID v4 string
 *  - vendor_id: required, indexed; MUST be validated to exist before write (TDD §6.2)
 *  - student_id: required; refs Users; NEVER expose in any API response (TDD §1.1, §6.2)
 *  - taste_score / value_score / overall_score: Integer 1–5 required
 *  - comment_text: Optional, max 1000 chars; HIDDEN from Guests (enforced at route layer)
 *  - report_health_concern: routes to Support escalation queue; NEVER shown publicly
 *  - is_frozen: Set by anomaly tripwire (TDD §6.4); frozen reviews not counted publicly
 *  - timestamp: Indexed for paginated fetch (newest first) and anomaly tripwire window
 *
 * Composite unique index on (student_id, vendor_id) enforces:
 *   "1 review per (student, vendor) — lifetime" (TDD §6.1 Rate Limiting)
 */
const ReviewSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    vendor_id: {
      type: String,
      ref: 'Vendor',
      required: [true, 'vendor_id is required'],
    },
    // ⚠ NEVER expose student_id in any API response — enforced at route layer
    student_id: {
      type: String,
      ref: 'User',
      required: [true, 'student_id is required'],
    },
    taste_score: {
      type: Number,
      required: [true, 'taste_score is required'],
      min: [1, 'taste_score minimum is 1'],
      max: [5, 'taste_score maximum is 5'],
      validate: {
        validator: Number.isInteger,
        message: 'taste_score must be an integer',
      },
    },
    value_score: {
      type: Number,
      required: [true, 'value_score is required'],
      min: [1, 'value_score minimum is 1'],
      max: [5, 'value_score maximum is 5'],
      validate: {
        validator: Number.isInteger,
        message: 'value_score must be an integer',
      },
    },
    overall_score: {
      type: Number,
      required: [true, 'overall_score is required'],
      min: [1, 'overall_score minimum is 1'],
      max: [5, 'overall_score maximum is 5'],
      validate: {
        validator: Number.isInteger,
        message: 'overall_score must be an integer',
      },
    },
    // Hidden from Guests (TDD §2.3). Max 1000 chars enforced here + route layer.
    comment_text: {
      type: String,
      default: null,
      maxlength: [1000, 'comment_text must be 1000 characters or fewer'],
      trim: true,
    },
    // Does NOT affect public scores. Routes to Support queue. NEVER shown publicly.
    report_health_concern: {
      type: Boolean,
      default: false,
    },
    // Set true by anomaly tripwire. Frozen reviews excluded from public aggregates.
    is_frozen: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
    strict: true,
    versionKey: false,
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // TDD §1.1: NEVER expose student_id in any API response
        delete ret.student_id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Mandatory Indexes (TDD §4.6) ────────────────────────────────────────────

// Paginated review fetch per vendor, newest first
ReviewSchema.index({ vendor_id: 1, timestamp: -1 });

// ⚠ CRITICAL: Powers the 60-minute anomaly tripwire query (TDD §4.6)
// Without this, a full collection scan occurs under 3,000-user load.
ReviewSchema.index({ vendor_id: 1, timestamp: 1, overall_score: 1 });

// Enforce lifetime uniqueness: 1 review per (student, vendor) (TDD §6.1)
ReviewSchema.index(
  { student_id: 1, vendor_id: 1 },
  { unique: true, name: 'unique_student_vendor_review' }
);

const Review = mongoose.model('Review', ReviewSchema, 'reviews');

module.exports = Review;
