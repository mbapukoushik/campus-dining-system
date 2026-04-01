'use strict';

/**
 * services/budgetPlanner.js
 *
 * Affordability Algorithm v2 (TDD §2.2 / §5.4)
 *
 * Algorithm Steps:
 *  1. Accept: budget (integer ₹), dietary_preference (optional), category (optional)
 *  2. Fetch all non-sold-out items from MongoDB (exclude is_sold_out: true)
 *  3. Apply dietary_preference filter if provided
 *  4. Apply category filter if provided
 *  5. Filter items where price <= budget
 *  6. Sort by price ascending (best-value-first)
 *  7. Group by vendor_id → pick the cheapest item per vendor
 *  8. Return recommendations with: vendor_id, item_name, price, category, dietary_tag, budget_remaining
 *
 * TDD §2.2 Anti-stuffing rule:
 *   - Max 3 recommendations returned total
 *   - budget_remaining = budget - price (per recommendation, not cumulative)
 *   - If 0 items satisfy constraints → return { recommendations: [], message: 'No items within budget' }
 *
 * Called exclusively from routes/planner.js
 */

const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');

/**
 * buildRecommendations
 *
 * @param {Object} params
 * @param {number}  params.budget              - Total budget in ₹ (positive integer)
 * @param {string} [params.dietary_preference] - One of: 'veg', 'non-veg', 'vegan', 'jain'
 * @param {string} [params.category]           - One of the MENU_CATEGORIES enum values
 * @returns {Promise<{recommendations: Array, meta: Object}>}
 */
async function buildRecommendations({ budget, dietary_preference, category }) {
  // ─── Step 1: Validate budget ─────────────────────────────────────────────
  if (!Number.isInteger(budget) || budget <= 0) {
    throw Object.assign(new Error('budget must be a positive integer'), { status: 400 });
  }

  // ─── Step 2: Build query — exclude sold-out items ────────────────────────
  const query = { is_sold_out: false };

  // ─── Step 3: Dietary preference filter ───────────────────────────────────
  if (dietary_preference) {
    query.dietary_tag = dietary_preference;
  }

  // ─── Step 4: Category filter ──────────────────────────────────────────────
  if (category) {
    query.category = category;
  }

  // ─── Step 5: Fetch affordable items (price <= budget) ────────────────────
  query.price = { $lte: budget };

  // Fetch sorted by price ascending (TDD §2.2: best-value-first)
  const affordableItems = await MenuItem.find(query)
    .sort({ price: 1 })
    .lean();

  // ─── Step 6: Group by vendor — pick cheapest per vendor ──────────────────
  // Because items are already sorted by price ASC, the first occurrence per vendor IS the cheapest.
  const vendorMap = new Map();
  for (const item of affordableItems) {
    if (!vendorMap.has(item.vendor_id)) {
      vendorMap.set(item.vendor_id, item);
    }
  }

  if (vendorMap.size === 0) {
    return {
      recommendations: [],
      message: 'No items within budget',
    };
  }

  // ─── Step 7: Build recommendations (max 3, TDD §2.2) ─────────────────────
  // Fetch vendor names to enrich the response
  const vendorIds = [...vendorMap.keys()];
  const vendors = await Vendor.find({ _id: { $in: vendorIds } })
    .select('stall_name location_tag is_currently_open')
    .lean();
  const vendorLookup = {};
  vendors.forEach((v) => {
    vendorLookup[v._id] = v;
  });

  const recommendations = [];
  for (const [vendorId, item] of vendorMap.entries()) {
    if (recommendations.length >= 3) break; // TDD §2.2: max 3

    recommendations.push({
      vendor_id: vendorId,
      stall_name: vendorLookup[vendorId]?.stall_name || 'Unknown',
      location_tag: vendorLookup[vendorId]?.location_tag || '',
      is_currently_open: vendorLookup[vendorId]?.is_currently_open ?? false,
      item_id: item._id,
      item_name: item.item_name,
      price: item.price,
      category: item.category,
      dietary_tag: item.dietary_tag || null,
      budget_remaining: budget - item.price,
    });
  }

  return {
    recommendations,
    meta: {
      budget_submitted: budget,
      dietary_preference: dietary_preference || null,
      category: category || null,
      total_results: recommendations.length,
    },
  };
}

module.exports = { buildRecommendations };
