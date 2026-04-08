'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * models/User.js
 *
 * TDD §4.1 — Users collection
 *
 * Constraints (TDD §1.1):
 *  - _id: UUID v4 string (NOT ObjectId)
 *  - email: Required, Unique, Indexed — validated against UNIVERSITY_EMAIL_DOMAIN at auth layer
 *  - role: Strict enum
 *  - is_verified: set to true only after Google OAuth domain check passes
 *  - created_at: Used server-side for anomaly tripwire account-age gate (TDD §6.4)
 *  - student_id MUST NEVER be exposed in any API response — enforced at route layer
 */
const UserSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ['guest', 'student', 'vendor', 'admin', 'support'],
        message: '"{VALUE}" is not a valid role',
      },
      required: [true, 'Role is required'],
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Use _id as string UUID — disable Mongoose's default ObjectId behaviour
    _id: false,
    strict: true,
    // Do NOT expose __v in API responses
    versionKey: false,
    // Disable automatic createdAt/updatedAt — we manage created_at explicitly
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // TDD §1.1 / §6.2: NEVER expose student_id in any API response
        // (student_id is the _id itself for student-role users — strip it)
        delete ret.student_id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// TDD §4.6: unique: true on the email field above already creates this index.
// Do NOT re-declare it here — that causes the duplicate index warning on startup.

// TDD §6.4 anomaly tripwire — account age check hits created_at
UserSchema.index({ created_at: 1 });

const User = mongoose.model('User', UserSchema, 'users');

module.exports = User;
