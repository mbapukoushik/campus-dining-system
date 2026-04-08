'use strict';

/**
 * tests/budgetPlanner.test.js
 *
 * Unit tests for the Budget Planner Affordability Algorithm (TDD §2.2)
 * and the Anti-Weaponization subnet helper (TDD §6.4).
 *
 * Submitted to: Dr. Sonali Mondal — Software Engineering & Management
 * SRM University AP
 *
 * Run with: npm test
 */

// ── Mock Mongoose models — no real DB connection needed ──────────────────────
jest.mock('../models/MenuItem', () => ({ find: jest.fn() }));
jest.mock('../models/Vendor',   () => ({ find: jest.fn() }));

const MenuItem = require('../models/MenuItem');
const Vendor   = require('../models/Vendor');
const { buildRecommendations } = require('../services/budgetPlanner');

// ── Mock helpers ─────────────────────────────────────────────────────────────
// MenuItem.find(query).lean() pattern
const mockMenuItems = (items) =>
  MenuItem.find.mockReturnValue({ lean: () => Promise.resolve(items) });

// Vendor.find(...).select(...).lean() pattern
const mockVendors = (vendors) =>
  Vendor.find.mockReturnValue({
    select: () => ({ lean: () => Promise.resolve(vendors) }),
  });

// ── Data factories ────────────────────────────────────────────────────────────
const makeItem = (id, price, vendor_id = 'v1') => ({
  _id: id, item_name: `Item-${id}`, price,
  category: 'lunch', dietary_tag: 'veg',
  vendor_id, is_sold_out: false,
});

const makeVendor = (id) => ({
  _id: id, stall_name: `Vendor ${id}`,
  location_tag: 'Mangalagiri', is_currently_open: true,
});

beforeEach(() => jest.clearAllMocks());

// ─── Suite 1: Affordability Algorithm ────────────────────────────────────────
describe('buildRecommendations — Affordability Algorithm (TDD §2.2)', () => {

  test('1. Returns "Highly Recommended" when ≥50% items fit budget AND median ≤ per-person budget', async () => {
    // ₹500 / 2 people = ₹250 pp
    // Items: ₹100, ₹150, ₹200, ₹300  →  3 of 4 fit (75%) ✓  |  Median = ₹175 ≤ ₹250 ✓
    mockMenuItems([makeItem('a', 100), makeItem('b', 150), makeItem('c', 200), makeItem('d', 300)]);
    mockVendors([makeVendor('v1')]);

    const result = await buildRecommendations({ budget: 500, headcount: 2, category: 'lunch' });

    expect(result.recommendation).toBe('Highly Recommended');
    expect(result.max_spend_warning).toBe(false);
    expect(result.per_person_budget).toBe(250);
  });

  test('2. Returns "Some Options Available" when <50% of items fit per-person budget', async () => {
    // ₹200 / 2 people = ₹100 pp
    // Items: ₹100, ₹200, ₹300, ₹400  →  1 of 4 fits (25%) ✗
    mockMenuItems([makeItem('a', 100), makeItem('b', 200), makeItem('c', 300), makeItem('d', 400)]);
    mockVendors([makeVendor('v1')]);

    const result = await buildRecommendations({ budget: 200, headcount: 2, category: 'lunch' });

    expect(result.recommendation).toBe('Some Options Available');
  });

  test('3. Sets max_spend_warning=true when cheapest item exceeds per-person budget', async () => {
    // ₹100 / 2 = ₹50 pp  |  Cheapest item = ₹150 → warn ✓
    mockMenuItems([makeItem('a', 150), makeItem('b', 200), makeItem('c', 250)]);
    mockVendors([]);

    const result = await buildRecommendations({ budget: 100, headcount: 2 });

    expect(result.max_spend_warning).toBe(true);
    expect(result.recommendations).toHaveLength(0);
  });

  test('4. Calculates correct per_person_budget for group headcount', async () => {
    // ₹900 / 3 = ₹300 pp
    mockMenuItems([]);
    mockVendors([]);

    const result = await buildRecommendations({ budget: 900, headcount: 3 });

    expect(result.per_person_budget).toBe(300);
    expect(result.meta.headcount).toBe(3);
    expect(result.meta.budget_submitted).toBe(900);
  });

  test('5. Rejects invalid budget and headcount with a 400 error', async () => {
    await expect(buildRecommendations({ budget: -50,      headcount: 1 }))
      .rejects.toMatchObject({ status: 400 });

    await expect(buildRecommendations({ budget: 500,      headcount: 0 }))
      .rejects.toMatchObject({ status: 400 });

    await expect(buildRecommendations({ budget: 'lots',   headcount: 1 }))
      .rejects.toMatchObject({ status: 400 });
  });

});

// ─── Suite 2: Anti-Weaponization Subnet Gate ──────────────────────────────────
describe('extractSubnet — Anti-Weaponization Gate (TDD §6.4)', () => {
  // Mirror of the exact function in routes/reviews.js (not exported — tested inline)
  function extractSubnet(ip) {
    if (!ip) return 'unknown';
    const ipv4 = ip.replace(/^::ffff:/, '');
    const parts = ipv4.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}`;
    return ip;
  }

  test('6. Extracts /24 subnet from a standard IPv4 address', () => {
    expect(extractSubnet('192.168.1.100')).toBe('192.168.1');
    expect(extractSubnet('10.0.0.5')).toBe('10.0.0');
  });

  test('7. Strips IPv6-mapped IPv4 prefix before extracting subnet', () => {
    expect(extractSubnet('::ffff:192.168.1.50')).toBe('192.168.1');
    expect(extractSubnet('::ffff:10.10.10.10')).toBe('10.10.10');
  });

  test('8. Returns "unknown" for null or empty IP values', () => {
    expect(extractSubnet(null)).toBe('unknown');
    expect(extractSubnet('')).toBe('unknown');
    expect(extractSubnet(undefined)).toBe('unknown');
  });

});
