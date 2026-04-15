# Requirements: Campus Dining & Vendor Quality Management System

**Defined:** 2026-04-15
**Core Value:** Find trustworthy food near SRM AP — with your budget, your diet, and your schedule in mind.

## v1 Requirements

### Authentication & RBAC

- [ ] **AUTH-01**: Student can sign in with Google OAuth (`@srmap.edu.in` accounts only).
- [ ] **AUTH-02**: Guest users can browse vendor scores without logging in (comment text hidden).
- [ ] **AUTH-03**: JWT is stored in an httpOnly cookie; session persists across browser refresh.
- [ ] **AUTH-04**: 5-tier RBAC enforced on all endpoints: Guest, Student, VendorOwner, Supporter, Admin.
- [ ] **AUTH-05**: VendorOwner role requires OTP verification + Supporter co-sign before activation.
- [ ] **AUTH-06**: `roleGuard` middleware centralises role checks — no inline role assertions in route files.

### Vendor Discovery

- [ ] **VEND-01**: Vendor data stored with GeoJSON Point coordinates and a `2dsphere` index.
- [ ] **VEND-02**: Each vendor has a `locationType` field: `inCampus` or `offCampus`.
- [ ] **VEND-03**: Student can browse a list of all vendors with name, cuisine, trust score, and current open status.
- [ ] **VEND-04**: Student can view a map pin view of vendors using their GeoJSON coordinates.
- [ ] **VEND-05**: Vendor detail page shows menu, operating hours, trust score breakdown, and reviews.
- [ ] **VEND-06**: VendorOwner can edit their own vendor's menu items and operating hours (not other vendors).

### Review System

- [ ] **REVW-01**: Authenticated Student can submit exactly 1 review per vendor (lifetime, enforced by Redis + DB unique index).
- [ ] **REVW-02**: Student is limited to 2 review submissions per hour globally (Redis sliding window).
- [ ] **REVW-03**: Review score fields: `taste_score`, `value_score`, `overall_score` (1–5 integer).
- [ ] **REVW-04**: Optional `comment_text` field; hidden from Guest role in API response.
- [ ] **REVW-05**: Optional `report_health_concern` boolean flag; never exposed in public responses.
- [ ] **REVW-06**: Anomaly Tripwire fires after >10 negative reviews (overall_score ≤ 2) for one vendor within 60 minutes.
- [ ] **REVW-07**: Tripwire applies anti-weaponization gates: account age >7 days, max 3 distinct /24 subnets, ≥1 prior review activity.
- [ ] **REVW-08**: Tripwire freezes vendor (`is_currently_open = false`) and marks suspicious reviews `is_frozen = true`.

### Budget Planner

- [ ] **BUDG-01**: API endpoint accepts `budget` (number), `headcount` (number), and `dietary_preference` (enum: `Veg`, `NonVeg`, `Jain`).
- [ ] **BUDG-02**: Returns recommended vendors and menu items that fit within the budget.
- [ ] **BUDG-03**: Per-person cost calculation accounts for packaging fees and applicable taxes (hidden fees).
- [ ] **BUDG-04**: Frontend Explainer Panel shows the user *why* each vendor/item was chosen (cost breakdown, dietary match).

### Trust Score

- [ ] **TRST-01**: Each vendor has a computed `trust_score` derived from weighted review scores (taste, value, overall).
- [ ] **TRST-02**: Frozen (`is_frozen`) reviews are excluded from trust score aggregation.
- [ ] **TRST-03**: Frontend Explainer Panel shows users exactly how the trust score was calculated.

### Admin Dashboard

- [ ] **ADMN-01**: Admin can view all vendors, users, and reviews.
- [ ] **ADMN-02**: Admin can manually freeze or unfreeze any vendor.
- [ ] **ADMN-03**: Admin dashboard includes a live Anomaly Tripwire feed showing flagged/blocked review events.
- [ ] **ADMN-04**: Admin can view and manage VendorOwner verification requests (approve/reject OTP + co-sign).

### Seed Data

- [ ] **SEED-01**: `scripts/seeder.js` populates ONLY real SRM AP vendors — no placeholder data.
- [ ] **SEED-02**: In-Campus vendors seeded: **Domino's**, **Slice of Cafe**.
- [ ] **SEED-03**: Off-Campus vendors seeded: **Alpha**, **Bismalla**, **Babi**, **One 8**, **Friends Corner**, **Ruchi**.
- [ ] **SEED-04**: All seeded vendors include GeoJSON point coordinates and `locationType` field.
- [ ] **SEED-05**: All seeded menu items include `dietary_tag` (Veg/Non-Veg/Jain) and a `packaging_fee` value.

### Testing & Quality

- [ ] **TEST-01**: Unit tests cover Budget Planner service logic (all dietary filter paths).
- [ ] **TEST-02**: Integration tests cover Anomaly Tripwire gates (account age, subnet, prior activity).
- [ ] **TEST-03**: Jest test suite passes with `npm test` in `backend/`.

## v2 Requirements

### Notifications

- **NOTF-01**: Student receives in-app notification when a vendor they reviewed is frozen.
- **NOTF-02**: VendorOwner receives notification when their menu is updated.

### Mobile & Offline

- **MOBL-01**: Progressive Web App (PWA) support for offline menu browsing.
- **MOBL-02**: Native Android/iOS app via React Native.

### Advanced Maps

- **MAPS-01**: Real-time vendor queue/wait time overlaid on map.
- **MAPS-02**: Walk-time estimation from student's current location to vendor pin.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Online ordering / payment | Outside academic scope; no payment processor integration |
| Real-time chat/messaging | High complexity, not core to the demo value |
| Loyalty points system | Nice-to-have; deferred to v2+ |
| Multi-university support | This build is SRM AP-specific by design |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 1 | Pending |
| VEND-01 | Phase 2 | Pending |
| VEND-02 | Phase 2 | Pending |
| VEND-03 | Phase 3 | Pending |
| VEND-04 | Phase 3 | Pending |
| VEND-05 | Phase 3 | Pending |
| VEND-06 | Phase 4 | Pending |
| REVW-01 | Phase 3 | Pending |
| REVW-02 | Phase 3 | Pending |
| REVW-03 | Phase 3 | Pending |
| REVW-04 | Phase 3 | Pending |
| REVW-05 | Phase 3 | Pending |
| REVW-06 | Phase 5 | Pending |
| REVW-07 | Phase 5 | Pending |
| REVW-08 | Phase 5 | Pending |
| BUDG-01 | Phase 4 | Pending |
| BUDG-02 | Phase 4 | Pending |
| BUDG-03 | Phase 4 | Pending |
| BUDG-04 | Phase 6 | Pending |
| TRST-01 | Phase 3 | Pending |
| TRST-02 | Phase 5 | Pending |
| TRST-03 | Phase 6 | Pending |
| ADMN-01 | Phase 6 | Pending |
| ADMN-02 | Phase 6 | Pending |
| ADMN-03 | Phase 6 | Pending |
| ADMN-04 | Phase 4 | Pending |
| SEED-01 | Phase 2 | Pending |
| SEED-02 | Phase 2 | Pending |
| SEED-03 | Phase 2 | Pending |
| SEED-04 | Phase 2 | Pending |
| SEED-05 | Phase 2 | Pending |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 5 | Pending |
| TEST-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 — red-team architecture review (VendorOwner role, GeoJSON, dietary Budget Planner, real SRM seed data, Tripwire Admin Dashboard)*
