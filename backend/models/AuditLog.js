'use strict';

const mongoose = require('mongoose');

/**
 * models/AuditLog.js
 *
 * TDD §4.5 — Audit_Logs collection
 */

const AuditLogSchema = new mongoose.Schema(
  {
    admin_id: {
      type: String,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['BLOCK_VENDOR', 'UNBLOCK_VENDOR', 'DELETE_REVIEW', 'RESET_SYSTEM'],
    },
    target_type: {
      type: String,
      required: true,
      enum: ['VENDOR', 'REVIEW', 'SYSTEM'],
    },
    target_id: {
      type: String, // ID of vendor or review
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: true,
    versionKey: false,
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const AuditLog = mongoose.model('AuditLog', AuditLogSchema, 'audit_logs');

module.exports = AuditLog;
