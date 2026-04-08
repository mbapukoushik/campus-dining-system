'use strict';

/**
 * services/budgetPlanner.js — Affordability Algorithm v2 (TDD §2.2)
 *
 * Algorithm (exact as specified):
 *   per_person_budget = total_budget / headcount
 *   items_in_category = Menu_Items where category == input.category AND is_sold_out == false
 *   items_within_budget = items_in_category where price <= per_person_budget
 *   median_price = median(items_in_category.map(i => i.price))
 *
 *   IF (items_within_budget.length / items_in_category.length >= 0.50)
 *      AND (median_price <= per_person_budget)
 *   THEN recommendation = 'Highly Recommended'
 *   ELSE recommendation = 'Some Options Available'
 *
 *   IF (MIN(items_in_category) > per_person_budget)
 *   THEN max_spend_warning = true
 */

const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function buildRecommendations({ budget, headcount = 1, dietary_preference, category }) {
  if (!Number.isInteger(budget) || budget <= 0)
    throw Object.assign(new Error('budget must be a positive integer'), { status: 400 });
  if (!Number.isInteger(headcount) || headcount < 1)
    throw Object.assign(new Error('headcount must be a positive integer'), { status: 400 });

  const per_person_budget = budget / headcount;

  // Fetch items_in_category (non-sold-out, filtered by category + dietary)
  const baseQuery = { is_sold_out: false };
  if (category) baseQuery.category = category;
  if (dietary_preference) baseQuery.dietary_tag = dietary_preference;

  const items_in_category = await MenuItem.find(baseQuery).lean();

  // items_within_budget
  const items_within_budget = items_in_category.filter(i => i.price <= per_person_budget);

  // Affordability calculation
  const prices = items_in_category.map(i => i.price);
  const median_price = median(prices);
  const min_price = prices.length ? Math.min(...prices) : Infinity;

  const max_spend_warning = min_price > per_person_budget;

  let recommendation = 'Some Options Available';
  if (items_in_category.length > 0) {
    const ratio = items_within_budget.length / items_in_category.length;
    if (ratio >= 0.50 && median_price <= per_person_budget) {
      recommendation = 'Highly Recommended';
    }
  }

  // Build affordable_items (sorted by price, max 20)
  const affordable_items = items_within_budget
    .sort((a, b) => a.price - b.price)
    .slice(0, 20);

  // Enrich with vendor data (top 3 unique vendors)
  const vendorMap = new Map();
  for (const item of items_within_budget.sort((a, b) => a.price - b.price)) {
    if (!vendorMap.has(String(item.vendor_id))) {
      vendorMap.set(String(item.vendor_id), item);
    }
  }

  const topVendorIds = [...vendorMap.keys()].slice(0, 3);
  const vendors = await Vendor.find({ _id: { $in: topVendorIds } })
    .select('stall_name location_tag is_currently_open')
    .lean();
  const vendorLookup = {};
  vendors.forEach(v => { vendorLookup[String(v._id)] = v; });

  const recommendations = topVendorIds.map(vendorId => {
    const item = vendorMap.get(vendorId);
    const v = vendorLookup[vendorId] || {};
    return {
      vendor_id: vendorId,
      stall_name: v.stall_name || 'Unknown',
      location_tag: v.location_tag || '',
      is_currently_open: v.is_currently_open ?? false,
      item_id: item._id,
      item_name: item.item_name,
      price: item.price,
      category: item.category,
      dietary_tag: item.dietary_tag || null,
      budget_remaining: Math.floor(per_person_budget - item.price),
    };
  });

  return {
    recommendation,
    max_spend_warning,
    per_person_budget: Math.floor(per_person_budget),
    affordable_items,
    recommendations,
    meta: {
      budget_submitted: budget,
      headcount,
      per_person_budget: Math.floor(per_person_budget),
      category: category || null,
      dietary_preference: dietary_preference || null,
      total_results: recommendations.length,
      items_in_category: items_in_category.length,
      items_within_budget: items_within_budget.length,
      median_price: Math.round(median_price),
    },
  };
}

module.exports = { buildRecommendations };
