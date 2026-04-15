# Codebase Concerns

**Analysis Date:** 2026-04-15

## Tech Debt

**Manual Subnet Extraction:**
- Issue: Manual string manipulation to extract /24 subnets from IPv4/IPv6-mapped addresses.
- File: `backend/routes/reviews.js` (lines 53-62).
- Why: Simple approach for campus LAN identification.
- Impact: May not handle pure IPv6 correctly; brittle if IP formats change.
- Fix approach: Use a dedicated IP library for robust subnet extraction.

## Security Considerations

**Student ID Leakage:**
- Risk: `student_id` is a sensitive field that must never be exposed to other users (Privacy TDD §1.1).
- Files: `backend/routes/reviews.js`, `backend/middleware/authenticate.js`, and all models.
- Current mitigation: Schema transforms (`toJSON`) and manual `delete` calls in `.lean()` queries.
- Recommendations: Ensure all new API endpoints strictly follow this pattern. Centralize the removal of sensitive fields in a shared utility.

**Admin Access Gate:**
- Risk: Improperly secured administrative endpoints.
- File: `backend/server.js` (lines 97-105).
- Current mitigation: Inline middleware array checking `req.user.role`.
- Recommendations: Move to a standardized `roleGuard` middleware to avoid duplication and potential bypasses.

## Fragile Areas

**Anomaly Tripwire (Review system):**
- File: `backend/routes/reviews.js` (lines 65-136).
- Why fragile: Complex asynchronous logic that interacts with multiple Redis keys and DB models. A failure here could lead to inconsistent state (e.g., vendor frozen but reviews not marked) if not handled carefully.
- Common failures: Redis outages or DB timeouts during the tripwire execution.
- Safe modification: Add comprehensive integration tests covering all "Tripwire" gates (age, subnet, prior activity).
- Test coverage: Current tests focus on budget planning (`budgetPlanner.test.js`), not the complex review tripwire.

**Coordination of Redis and MongoDB:**
- Why fragile: Multiple endpoints (e.g., `POST /reviews`) rely on atomic-like coordination between Redis (for rate limits/subnets) and MongoDB (for persistence).
- Safe modification: Use Redis lua scripts or pipelines where possible to ensure atomicity for multi-key updates.

## Missing Critical Features

**Review Retraction:**
- Problem: No mechanism for students to edit or delete their reviews once submitted.
- Current workaround: Direct database intervention by admin.
- Blocks: Users cannot correct mistakes or update their opinion after more visits.
- Implementation complexity: Low (add `PUT/DELETE` routes with `student_id` ownership check).

## Test Coverage Gaps

**Review Tripwire and Anti-Weaponization:**
- What's not tested: The entire logic in `backend/routes/reviews.js` regarding anomaly detection, freezing, and anti-spam gates.
- Risk: Critical anti-abuse features could fail or over-trigger without notice.
- Priority: High.

---

*Concerns audit: 2026-04-15*
*Update as issues are fixed or new ones discovered*
