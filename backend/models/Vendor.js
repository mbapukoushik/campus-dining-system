'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { DateTime } = require('luxon');

/**
 * models/Vendor.js
 *
 * TDD §4.2 — Vendors collection
 *
 * Key rules:
 *  - _id: UUID v4 string
 *  - owner_id: refs Users — ALL vendor write endpoints must verify req.user._id === owner_id (TDD §6.3)
 *  - operating_hours: array of { day: 0–6, open: 'HH:MM', close: 'HH:MM' }  (0 = Sunday)
 *  - is_currently_open: manual override boolean; source of truth for "open" is
 *      is_currently_open AND is_within_hours combined
 *  - is_within_hours: VIRTUAL — computed with luxon + process.env.UNIVERSITY_TIMEZONE (TDD §4.2)
 *    NEVER stored in the database.
 *
 * Auto-close hook (TDD §4.2):
 *  When any Menu_Item save/delete results in 0 items for this vendor,
 *  is_currently_open is set to false via a post-save hook on the MenuItem model.
 *  The hook is registered there to avoid a circular dependency.
 */

const OperatingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      min: 0,
      max: 6,
      required: true,
    },
    open: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'open must be in HH:MM format'],
    },
    close: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'close must be in HH:MM format'],
    },
  },
  { _id: false }
);

const VendorSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    owner_id: {
      type: String,
      ref: 'User',
      required: [true, 'owner_id is required'],
    },
    stall_name: {
      type: String,
      required: [true, 'stall_name is required'],
      trim: true,
    },
    location_tag: {
      type: String,
      required: [true, 'location_tag is required'],
      trim: true,
    },
    operating_hours: {
      type: [OperatingHoursSchema],
      required: [true, 'operating_hours is required'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'operating_hours must contain at least one entry',
      },
    },
    is_currently_open: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
    strict: true,
    versionKey: false,
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * is_within_hours virtual (TDD §4.2 — Timezone Logic Implementation)
 *
 * Uses luxon with UNIVERSITY_TIMEZONE env var.
 * Luxon weekday: 1=Monday … 7=Sunday. Convert to 0=Sunday … 6=Saturday
 * to match the TDD operating_hours.day convention.
 *
 * Formula from TDD:
 *   dayOfWeek = now.weekday % 7   →  Mon=1%7=1, …, Sun=7%7=0
 *
 * NEVER hardcode the timezone string (TDD §1.1).
 */
VendorSchema.virtual('is_within_hours').get(function () {
  const tz = process.env.UNIVERSITY_TIMEZONE;
  if (!tz) {
    console.error('[Vendor.is_within_hours] UNIVERSITY_TIMEZONE env var is not set');
    return false;
  }

  const now = DateTime.now().setZone(tz);
  const dayOfWeek = now.weekday % 7; // luxon: 1=Mon…7=Sun → 0=Sun…6=Sat
  const currentTime = now.toFormat('HH:mm');

  const todayHours = this.operating_hours.find((h) => h.day === dayOfWeek);

  const isWithinHours =
    todayHours != null &&
    currentTime >= todayHours.open &&
    currentTime <= todayHours.close;

  return isWithinHours;
});

// ─── Mandatory Indexes (TDD §4.6) ────────────────────────────────────────────

// Primary vendor browse query — filter by location + open status
VendorSchema.index({ location_tag: 1, is_currently_open: 1 });

const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');

module.exports = Vendor;
