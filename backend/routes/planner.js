'use strict';

/**
 * routes/planner.js
 *
 * Budget Planner API (TDD §5.4)
 *
 * POST /api/planner/recommend
 *   Body: { budget: integer, dietary_preference?: string, category?: string }
 *   Auth: JWT required (student role minimum — verified university users only)
 *   Response: { recommendations: [...], meta: {...} }
 *
 * Delegates heavy logic to services/budgetPlanner.js (Affordability Algorithm v2).
 */

const express = require('express');
const router = express.Router();

const { buildRecommendations } = require('../services/budgetPlanner');
const authenticate = require('../middleware/authenticate');
const roleGuard = require('../middleware/roleGuard');
const { MENU_CATEGORIES } = require('../models/MenuItem');
const { DIETARY_TAGS } = require('../models/MenuItem');

// ─── POST /api/planner/recommend ─────────────────────────────────────────────
// Public: Guest OK as per TDD §5.4
router.post(
  '/recommend',
  async (req, res) => {
    try {
      const { budget, headcount, dietary_preference, category } = req.body;

      // ── Input validation ────────────────────────────────────────────────────

      // budget is mandatory
      if (budget === undefined || budget === null) {
        return res.status(400).json({ error: 'budget is required' });
      }

      // budget must be a positive integer
      if (!Number.isInteger(Number(budget)) || Number(budget) <= 0) {
        return res.status(400).json({ error: 'budget must be a positive integer' });
      }

      // Validate optional dietary_preference
      if (dietary_preference && !DIETARY_TAGS.includes(dietary_preference)) {
        return res.status(400).json({
          error: `dietary_preference must be one of: ${DIETARY_TAGS.join(', ')}`,
        });
      }

      // Validate optional headcount
      const parsedHeadcount = headcount !== undefined ? Number(headcount) : 1;
      if (!Number.isInteger(parsedHeadcount) || parsedHeadcount < 1 || parsedHeadcount > 100) {
        return res.status(400).json({ error: 'headcount must be a positive integer (max 100)' });
      }

      // Validate optional category
      if (category && !MENU_CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: `category must be one of: ${MENU_CATEGORIES.join(', ')}`,
        });
      }

      const result = await buildRecommendations({
        budget: Number(budget),
        headcount: parsedHeadcount,
        dietary_preference: dietary_preference || null,
        category: category || null,
      });

      return res.status(200).json(result);
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ error: err.message });
      }
      console.error('[POST /api/planner/recommend] Error:', err.message);
      return res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }
);

module.exports = router;
