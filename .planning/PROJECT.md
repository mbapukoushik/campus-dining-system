# Project: Campus Dining & Vendor Quality Management System

**Created:** 2026-04-15
**Milestone:** v1.0 — Academic Demo Release

## Problem

Students at SRM University AP have no reliable, trustworthy way to discover on-campus and off-campus food vendors, compare quality, or plan meals around a budget. Existing solutions are informal (WhatsApp groups, word of mouth) and provide no protection against manipulated reviews or hidden costs.

## Solution

A full-stack web platform that lets students discover, review, and budget for verified campus and off-campus food vendors. The system is backed by a transparent trust-scoring algorithm, an Anomaly Tripwire that catches coordinated fake reviews before they affect ratings, and a dietary-aware budget planner that accounts for real-world pricing.

## Core Value

**"Find trustworthy food near SRM AP — with your budget, your diet, and your schedule in mind."**

## Target Users

| Role | Description |
|------|------------|
| **Student** | Primary user. Browses vendors, reads reviews, submits reviews, uses budget planner. |
| **Guest** | Anonymous user. Can see vendor scores only (no comment text). |
| **VendorOwner** | Can edit their own menu items and operating hours. Verified via OTP + Supporter co-sign. |
| **Supporter** | Trusted student or staff who co-signs VendorOwner verifications. |
| **Admin** | Full platform control. Can freeze/unfreeze vendors, view Anomaly Tripwire dashboard, manage all users. |

## Architecture Decisions

- **Backend:** Node.js + Express (REST API, JWT + Passport auth)
- **Frontend:** React 19 + Vite (SPA)
- **Database:** MongoDB with Mongoose (GeoJSON 2dsphere index for vendor locations)
- **Cache/Rate-Limiting:** Redis (ioredis)
- **Auth:** Google OAuth 2.0 restricted to `@srmap.edu.in` domain
- **Seed Data:** Real SRM University vendors only (Domino's, Slice of Cafe, Alpha, Bismalla, Babi, One 8, Friends Corner, Ruchi)

## Key Constraints (Red-Team Review)

1. `VendorOwner` role requires OTP verification + Supporter co-sign before activation.
2. Budget Planner must accept `dietary_preference` (Veg/Non-Veg/Jain) and account for packaging fees and taxes.
3. Vendor locations MUST be stored as GeoJSON Points with a `2dsphere` index. A `locationType` field distinguishes `inCampus` vs `offCampus`.
4. Seed script must use ONLY real SRM AP vendors — no placeholder data.
5. Admin dashboard must expose a live Anomaly Tripwire feed showing blocked/flagged reviews in real time.
6. Frontend must include Explainer UI Panels showing how Trust Scores and Budget recommendations are derived.

## Success Criteria

- [ ] Students can log in with their `@srmap.edu.in` Google account.
- [ ] Vendor map shows both on-campus and off-campus vendors using GeoJSON coordinates.
- [ ] Review system enforces 1-review-per-vendor (lifetime) and max 2 reviews/hour.
- [ ] Anomaly Tripwire freezes vendors on coordinated negative review spikes.
- [ ] Budget Planner returns dietary-filtered vendor + menu recommendations within a given budget.
- [ ] Admin dashboard shows live Tripwire activity and vendor trust scores.
- [ ] All 5 RBAC roles enforced end-to-end.

---
*Project initialized: 2026-04-15*
*Updated: 2026-04-15 (red-team architecture review)*
