'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

/**
 * models/MenuItem.js
 *
 * TDD §4.3 — Menu_Items collection
 *
 * Key rules:
 *  - _id: UUID v4 string
 *  - vendor_id: Required; refs Vendors; Indexed (compound index with is_sold_out + category)
 *  - price: Integer > 0 — reject null, zero, or negative values at schema validation layer
 *  - category: Strict enum — defined in config/constants.js to avoid hardcoding
 *  - dietary_tag: Optional strict enum
 *  - image_url: Optional; must be a Cloudinary/S3 URL; 5MB pre-upload enforced by multer middleware
 *  - is_sold_out: Vendor can toggle; excluded from budget planner when true
 *
 * Auto-close hook (TDD §4.2):
 *  After any save/remove on MenuItem, if the vendor's remaining item count reaches 0,
 *  set vendor.is_currently_open = false automatically.
 */

// ─── Category Enum (TDD §4.3: "Define enum in config") ───────────────────────
// Centralised here; imported by routes/services that need it too.
const MENU_CATEGORIES = [
  'breakfast',
  'lunch',
  'dinner',
  'snacks',
  'beverages',
  'desserts',
  'combos',
];

const DIETARY_TAGS = ['veg', 'non-veg', 'vegan', 'jain'];

const MenuItemSchema = new mongoose.Schema(
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
    item_name: {
      type: String,
      required: [true, 'item_name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'price is required'],
      validate: {
        validator: (v) => Number.isInteger(v) && v > 0,
        message: 'price must be a positive integer greater than 0',
      },
    },
    category: {
      type: String,
      enum: {
        values: MENU_CATEGORIES,
        message: '"{VALUE}" is not a valid category',
      },
      required: [true, 'category is required'],
    },
    dietary_tag: {
      type: String,
      enum: {
        values: DIETARY_TAGS,
        message: '"{VALUE}" is not a valid dietary_tag',
      },
      default: null,
    },
    image_url: {
      type: String,
      default: null,
      trim: true,
    },
    is_sold_out: {
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

// ─── Mandatory Indexes (TDD §4.6) ────────────────────────────────────────────

// Menu fetch + budget planner category filter
MenuItemSchema.index({ vendor_id: 1, is_sold_out: 1, category: 1 });

// ─── Auto-close Hook (TDD §4.2) ──────────────────────────────────────────────
// After saving or deleting a menu item, check if the vendor now has 0 items.
// If so, force is_currently_open = false on the vendor document.

async function autoCloseVendorIfEmpty(vendorId) {
  if (!vendorId) return;
  try {
    // Avoid circular require by dynamically requiring Vendor
    const Vendor = require('./Vendor');
    const MenuItem = mongoose.model('MenuItem');
    const count = await MenuItem.countDocuments({ vendor_id: vendorId });
    if (count === 0) {
      await Vendor.findByIdAndUpdate(vendorId, { is_currently_open: false });
      console.log(`[MenuItem hook] Vendor ${vendorId} auto-closed (0 menu items)`);
    }
  } catch (err) {
    console.error('[MenuItem hook] Auto-close error:', err.message);
  }
}

MenuItemSchema.post('save', async function () {
  await autoCloseVendorIfEmpty(this.vendor_id);
});

// Mongoose v8 uses deleteOne/findOneAndDelete — handle both
MenuItemSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await autoCloseVendorIfEmpty(doc.vendor_id);
});

MenuItemSchema.post('deleteOne', { document: true, query: false }, async function () {
  await autoCloseVendorIfEmpty(this.vendor_id);
});

const MenuItem = mongoose.model('MenuItem', MenuItemSchema, 'menu_items');

module.exports = MenuItem;
module.exports.MENU_CATEGORIES = MENU_CATEGORIES;
module.exports.DIETARY_TAGS = DIETARY_TAGS;
