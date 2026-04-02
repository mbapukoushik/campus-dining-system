'use strict';

/**
 * services/budgetPlanner.js
 *
 * Affordability Algorithm v2 (TDD §2.2 / §5.4)
 *
 * Algorithm Steps:
 *  1. Accept: budget (integer ₹), headcount (integer ≥1), dietary_preference (optional), category (optional)
 *  2. Compute perPersonBudget = Math.floor(budget / headcount)
 *  3. Fetch all non-sold-out items from MongoDB (exclude is_sold_out: true)
 *  4. Apply dietary_preference filter if provided
 *  5. Apply category filter if provided
 *  6. Filter items where price <= perPersonBudget
 *  7. Sort by price ascending (best-value-first)
 *  8. Group by vendor_id → pick the cheapest item per vendor
 *  9. Return max 3 recommendations with enriched vendor data
 * 10. Inject max_spend_warning: true if the absolute cheapest item (pre-filter)
 *     costs MORE than perPersonBudget (i.e. no item is affordable per-person)
 *
 * TDD §2.2 Anti-stuffing rule:
 *   - Max 3 recommendations returned total
 *   - budget_remaining = perPersonBudget - price (per recommendation)
 *   - If 0 items satisfy constraints → return { recommendations: [], message: 'No items within budget' }
 */

const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');

/**
 * buildRecommendations
 *
 * @param {Object} params
 * @param {number}  params.budget              - Total budget in ₹ (positive integer)
 * @param {number} [params.headcount]          - Number of people (default: 1)
 * @param {string} [params.dietary_preference] - One of: 'veg', 'non-veg', 'vegan', 'jain'
 * @param {string} [params.category]           - One of the MENU_CATEGORIES enum values
 * @returns {Promise<{recommendations: Array, meta: Object, max_spend_warning?: boolean}>}
 */
async function buildRecommendations({ budget, headcount = 1, dietary_preference, category }) {
  // ─── Step 1: Validate inputs ──────────────────────────────────────────────
  if (!Number.isInteger(budget) || budget <= 0) {
    throw Object.assign(new Error('budget must be a positive integer'), { status: 400 });
  }
  if (!Number.isInteger(headcount) || headcount < 1) {
    throw Object.assign(new Error('headcount must be a positive integer'), { status: 400 });
  }

  // ─── Step 2: Per-person budget ────────────────────────────────────────────
  const perPersonBudget = Math.floor(budget / headcount);

  // ─── Step 3: Build query — exclude sold-out items ────────────────────────
  const baseQuery = { is_sold_out: false };

  // ─── Step 4: Dietary preference filter ───────────────────────────────────
  if (dietary_preference) {
    baseQuery.dietary_tag = dietary_preference;
  }

  // ─── Step 5: Category filter ──────────────────────────────────────────────
  if (category) {
    baseQuery.category = category;
  }

  // ─── max_spend_warning: find the cheapest item BEFORE applying budget cap ─
  // If even the cheapest item > perPersonBudget, warn the user
  const cheapestItem = await MenuItem.findOne(baseQuery).sort({ price: 1 }).lean();
  const max_spend_warning = cheapestItem ? cheapestItem.price > perPersonBudget : false;

  // ─── Step 6: Fetch affordable items (price <= perPersonBudget) ───────────
  const affordableQuery = { ...baseQuery, price: { $lte: perPersonBudget } };

  const affordableItems = await MenuItem.find(affordableQuery)
    .sort({ price: 1 })
    .lean();

  // ─── Step 7: Group by vendor — pick cheapest per vendor ──────────────────
  const vendorMap = new Map();
  for (const item of affordableItems) {
    if (!vendorMap.has(String(item.vendor_id))) {
      vendorMap.set(String(item.vendor_id), item);
    }
  }

  if (vendorMap.size === 0) {
    return {
      recommendations: [],
      max_spend_warning,
      message: max_spend_warning
        ? `No items within per-person budget of ₹${perPersonBudget}`
        : 'No items within budget',
      meta: {
        budget_submitted: budget,
        headcount,
        per_person_budget: perPersonBudget,
        dietary_preference: dietary_preference || null,
        category: category || null,
        total_results: 0,
      },
    };
  }

  // ─── Step 8: Build recommendations (max 3, TDD §2.2) ─────────────────────
  const vendorIds = [...vendorMap.keys()];
  const vendors = await Vendor.find({ _id: { $in: vendorIds } })
    .select('stall_name location_tag is_currently_open')
    .lean();
  const vendorLookup = {};
  vendors.forEach((v) => {
    vendorLookup[String(v._id)] = v;
  });

  const recommendations = [];
  for (const [vendorId, item] of vendorMap.entries()) {
    if (recommendations.length >= 3) break;

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
      budget_remaining: perPersonBudget - item.price,
    });
  }

  return {
    recommendations,
    max_spend_warning,
    meta: {
      budget_submitted: budget,
      headcount,
      per_person_budget: perPersonBudget,
      dietary_preference: dietary_preference || null,
      category: category || null,
      total_results: recommendations.length,
    },
  };
}

module.exports = { buildRecommendations };
