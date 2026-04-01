'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * models/WaitTime.js
 *
 * TDD §4.5 — Wait_Times collection
 *
 * Key rules:
 *  - _id: UUID v4 string
 *  - vendor_id: Required, indexed; Must be validated to exist before write (TDD §6.2)
 *  - student_id: Required, refs Users; Used for rate limiting — NEVER expose in response
 *  - reported_minutes: Integer > 0
 *  - timestamp: TTL index auto-deletes document after 1200 seconds (20 minutes) (TDD §2.4)
 *
 * Quorum logic (TDD §2.4) — enforced in the route handler, not the model:
 *  - < 3 distinct student_id reports → return { confirmed: false, report_count: N }
 *  - ≥ 3 reports              → return { confirmed: true, average_minutes: N (rounded) }
 *
 * Rate limit (TDD §2.4) — 1 report per (student_id, vendor_id) per 30-minute rolling window.
 *  Enforced via the compound index below + Redis sliding window in middleware.
 */
const WaitTimeSchema = new mongoose.Schema(
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
    // Used for rate limiting only — NEVER expose in API response
    student_id: {
      type: String,
      ref: 'User',
      required: [true, 'student_id is required'],
    },
    reported_minutes: {
      type: Number,
      required: [true, 'reported_minutes is required'],
      validate: {
        validator: (v) => Number.isInteger(v) && v > 0,
        message: 'reported_minutes must be a positive integer greater than 0',
      },
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
        // Rate-limit field only — never expose in responses
        delete ret.student_id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Mandatory Indexes (TDD §4.6) ────────────────────────────────────────────

// TTL auto-delete: each document expires after 20 minutes (1200 seconds) (TDD §2.4)
// THIS IS the 20-minute wait time decay mechanism — do NOT skip.
WaitTimeSchema.index({ timestamp: 1 }, { expireAfterSeconds: 1200 });

// Rate limit check: 1 report per (student, vendor) per 30-min window
// Also serves wait-time stuffing prevention (TDD §4.6 / v3.0 patch notes)
WaitTimeSchema.index({ vendor_id: 1, student_id: 1, timestamp: -1 });

const WaitTime = mongoose.model('WaitTime', WaitTimeSchema, 'wait_times');

module.exports = WaitTime;
