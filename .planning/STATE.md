# GSD State

**Project:** Campus Dining & Vendor Quality Management System
**Milestone:** v1.0 — Academic Demo Release
**Last Updated:** 2026-04-15

## Current Status

**Active Phase:** Phase 1 — Core Auth & RBAC Foundation
**Overall Progress:** 0/7 phases complete

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Core Auth & RBAC Foundation | 🔵 Active |
| 2 | GeoJSON Vendor Schema & Real Seed Data | ⬜ Pending |
| 3 | Vendor Discovery & Review API | ⬜ Pending |
| 4 | VendorOwner Role & Budget Planner API | ⬜ Pending |
| 5 | Anomaly Tripwire Hardening | ⬜ Pending |
| 6 | Frontend: Map, Explainer Panels & Admin Dashboard | ⬜ Pending |
| 7 | Polish, Test Coverage & Demo Prep | ⬜ Pending |

## Key Decisions Locked

- **Auth:** Google OAuth restricted to `@srmap.edu.in`, JWT in httpOnly cookie.
- **RBAC:** 5 roles: Guest, Student, VendorOwner, Supporter, Admin.
- **VendorOwner activation:** OTP + Supporter co-sign (not self-serve).
- **Database:** GeoJSON `2dsphere` index for vendor locations; `locationType` field required.
- **Seed data:** ONLY real SRM AP vendors — Domino's, Slice of Cafe (in-campus); Alpha, Bismalla, Babi, One 8, Friends Corner, Ruchi (off-campus).
- **Budget Planner:** Must filter by `dietary_preference` (Veg/NonVeg/Jain) and include packaging fees + taxes.
- **Admin Dashboard:** Live Anomaly Tripwire event feed required for demo.
- **Explainer UI:** Trust score and budget breakdown panels required for demo transparency.

## Architecture Constraints

See `.planning/codebase/` for the full codebase map.
See `.planning/ROADMAP.md` for phase breakdown.
See `.planning/REQUIREMENTS.md` for requirement IDs.

---
*State initialized: 2026-04-15*
