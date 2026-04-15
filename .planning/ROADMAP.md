# Roadmap: Campus Dining & Vendor Quality Management System

**Milestone:** v1.0 — Academic Demo Release
**Target:** SRM University AP presentation
**Created:** 2026-04-15

## Phases

---

### Phase 1 — Core Auth & RBAC Foundation
**Goal:** Establish the 5-tier RBAC system and secure authentication baseline. Every subsequent phase depends on this working correctly.

**Covers:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-06

**Deliverables:**
- Google OAuth restricted to `@srmap.edu.in` (Passport strategy already wired; verify domain enforcement).
- Guest access returns vendor scores only, hides `comment_text`.
- JWT stored in httpOnly cookie; session survives browser refresh.
- Centralized `roleGuard` middleware replaces all inline role checks in route files.
- 5 roles defined and documented: Guest, Student, VendorOwner, Supporter, Admin.

**UAT:**
- Sign in with an `@srmap.edu.in` Google account → lands on student dashboard.
- Sign in with a non-SRM email → rejected with a clear error.
- Unauthenticated request to a protected endpoint → 401.
- Student hitting an admin endpoint → 403.

---

### Phase 2 — GeoJSON Vendor Schema & Real Seed Data
**Goal:** Rebuild the vendor database schema to use GeoJSON and populate it exclusively with real SRM AP vendors.

**Covers:** VEND-01, VEND-02, SEED-01, SEED-02, SEED-03, SEED-04, SEED-05

**Depends on:** Phase 1

**Deliverables:**
- `Vendor` Mongoose schema updated:
  - `location`: `{ type: 'Point', coordinates: [lng, lat] }` with `2dsphere` index.
  - `locationType`: enum `['inCampus', 'offCampus']`.
  - Menu items gain `dietary_tag` (enum: `Veg`, `NonVeg`, `Jain`) and `packaging_fee` (Number).
- `scripts/seeder.js` completely rewritten with real vendors:
  - **In-Campus:** Domino's, Slice of Cafe
  - **Off-Campus:** Alpha, Bismalla, Babi, One 8, Friends Corner, Ruchi
- MongoDB migration written for existing data.
- `npm run seed` idempotent — clears and re-seeds cleanly.

**UAT:**
- Run `npm run seed`, then query `/api/vendors` → exactly 8 vendors returned with `coordinates` arrays.
- Each vendor has `locationType` set correctly.
- Each menu item has `dietary_tag` and `packaging_fee`.

---

### Phase 3 — Vendor Discovery & Review API
**Goal:** Expose the vendor listing and review endpoints; wire up trust score aggregation.

**Covers:** VEND-03, VEND-05, REVW-01, REVW-02, REVW-03, REVW-04, REVW-05, TRST-01

**Depends on:** Phase 2

**Deliverables:**
- `GET /api/vendors` — paginated vendor list with trust score and open status.
- `GET /api/vendors/:id` — vendor detail with menu items.
- `GET /api/vendors/:id/reviews` — paginated reviews; `comment_text` hidden for Guest.
- `POST /api/vendors/:id/reviews` — enforces 1-lifetime + 2/hour Redis rate limits.
- Trust score computation: weighted average of non-frozen reviews, updated on each new review.

**UAT:**
- Student submits a review → 201 returned, trust score updates.
- Same student submits a second review to same vendor → 429 (lifetime).
- Student submits 3 reviews in 1 hour to different vendors → 3rd request returns 429.
- Guest calls review list → `comment_text` absent from response.

---

### Phase 4 — VendorOwner Role & Budget Planner API
**Goal:** Implement the VendorOwner verification flow and the dietary-aware budget planner.

**Covers:** VEND-06, AUTH-05, BUDG-01, BUDG-02, BUDG-03, ADMN-04, TEST-01

**Depends on:** Phase 2, Phase 3

**Deliverables:**
- `POST /api/auth/vendor-owner/request` — VendorOwner registration flow:
  1. Email OTP sent to vendor's contact email.
  2. A Supporter must co-sign via `POST /api/auth/vendor-owner/cosign`.
  3. Admin approves via Admin dashboard queue.
- `PUT /api/vendors/:id/menu` — VendorOwner can edit their own vendor's menu + hours only.
- `POST /api/planner/budget` — accepts `{ budget, headcount, dietary_preference }`:
  - Filters menu items by `dietary_tag`.
  - Calculates `(price + packaging_fee) * headcount` with tax applied.
  - Returns ranked vendor/item matches within budget.
- Jest unit tests for all Budget Planner calculation paths (Veg, NonVeg, Jain; hidden fee edge cases).

**UAT:**
- VendorOwner of Domino's can update Domino's menu. Attempt to update Alpha's menu → 403.
- Budget Planner with `dietary_preference: "Jain"` → only Jain-tagged items returned.
- Budget Planner result costs never exceed `budget` after packaging fees + taxes.

---

### Phase 5 — Anomaly Tripwire Hardening & Trust Score Integration
**Goal:** Make the Anomaly Tripwire battle-hardened with tests and ensure frozen reviews are correctly excluded from trust scores.

**Covers:** REVW-06, REVW-07, REVW-08, TRST-02, TEST-02

**Depends on:** Phase 3

**Deliverables:**
- Tripwire logic audited:
  - Account age gate (>7 days).
  - Subnet gate (max 3 distinct /24 subnets).
  - Prior activity gate (≥1 review at another vendor).
- Vendor freeze correctly sets `is_currently_open = false`.
- Frozen reviews (`is_frozen = true`) fully excluded from trust score, vendor list aggregates, and public GET responses.
- Integration test suite in `backend/tests/tripwire.test.js` covering all gate paths (pass, fail per gate).
- Redis key cleanup logic to prevent stale subnet keys from persisting.

**UAT:**
- Simulate 11 negative reviews within 60 min from 1 subnet → vendor frozen, reviews flagged.
- Simulate 11 reviews from 4 distinct subnets → subnet gate blocks freeze.
- Simulate 11 reviews from new accounts with no prior activity → gate blocks freeze.
- Frozen vendor trust score excludes flagged reviews.

---

### Phase 6 — Frontend: Vendor Map, Explainer Panels & Admin Dashboard
**Goal:** Build the full React UI — map view, transparency explainer panels, and the live admin dashboard.

**Covers:** VEND-04, BUDG-04, TRST-03, ADMN-01, ADMN-02, ADMN-03

**Depends on:** Phase 3, Phase 4, Phase 5

**Deliverables:**
- **Vendor Map View:** Interactive map (Leaflet or Google Maps) rendering GeoJSON pins. Colour-coded by `locationType` (inCampus vs offCampus). Click pin → vendor card popup.
- **Trust Score Explainer Panel:** Inline UI card showing `avg_taste`, `avg_value`, `avg_overall`, total review count, and weight formula used.
- **Budget Planner Explainer Panel:** After recommendation, shows per-item cost breakdown: base price + packaging fee + tax = total per person × headcount.
- **Admin Dashboard:**
  - Vendor management table (freeze/unfreeze button).
  - User management table.
  - **Live Anomaly Tripwire Feed:** Scrolling event log of Tripwire triggers, gate results, and freeze decisions. Polls `/api/admin/tripwire-events` every 10s.

**UAT:**
- Map renders all 8 seeded vendors. In-campus and off-campus pins visually distinct.
- Trust Score Explainer shows correct values from `/api/vendors/:id/reviews` aggregate.
- Budget Planner result shows per-item cost breakdown matching server calculation.
- Admin Tripwire feed shows a new entry within 10s of a freeze event.

---

### Phase 7 — Polish, Test Coverage & Demo Prep
**Goal:** Close all test gaps, seed the demo state cleanly, and verify the full user journey end-to-end.

**Covers:** TEST-03

**Depends on:** All previous phases

**Deliverables:**
- Full Jest test run passes (`npm test` — zero failures).
- End-to-end demo script documented in `README.md` (login → browse → review → budget plan → admin view).
- Demo seed data represents a realistic state: vendors with reviews, some frozen, varied trust scores.
- `.env.example` up-to-date with all required variables.
- `README.md` updated with setup instructions for new team members.

**UAT:**
- `npm test` exits 0.
- A new team member can clone, follow README, run `npm run seed`, and have the full system running locally within 15 minutes.
- Full demo walkthrough completes without errors.

---

## Backlog (999.x)

| ID | Feature | Notes |
|----|---------|-------|
| 999.1 | PWA offline mode | v2 feature |
| 999.2 | Push notifications for freezes | v2 feature |
| 999.3 | Walk-time estimation on map | v2 feature |
| 999.4 | Review retraction / edit | Low complexity, pull forward if time allows |

---

## Summary

| Phase | Theme | Key Output |
|-------|-------|-----------|
| 1 | Auth & RBAC | `roleGuard`, 5 roles, Google OAuth |
| 2 | GeoJSON Schema & Real Seeds | 8 real SRM vendors, dietary tags |
| 3 | Vendor Discovery & Reviews | Full review API, trust score |
| 4 | VendorOwner & Budget Planner | OTP flow, dietary-aware budget API |
| 5 | Tripwire Hardening | Integration tests, frozen review exclusion |
| 6 | Frontend & Admin Dashboard | Map, Explainers, Live Tripwire feed |
| 7 | Polish & Demo Prep | Full test pass, clean demo state |

---
*Roadmap created: 2026-04-15*
*Last updated: 2026-04-15 — red-team architecture review integrated (VendorOwner OTP, GeoJSON, dietary Budget Planner, real seed data, Tripwire Admin Dashboard, Explainer UI panels)*
