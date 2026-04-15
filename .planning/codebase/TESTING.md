# Testing Patterns

**Analysis Date:** 2026-04-15

## Test Framework

**Runner:**
- Jest 29.7.0
- Config: `jest` object in `backend/package.json` (lines 40-45).

**Assertion Library:**
- Jest built-in `expect`.
- Matchers: `toBe`, `toEqual`, `toMatchObject`.

**Run Commands:**
```bash
# In backend/ directory
npm test                              # Run all tests
npm run test -- --watch               # Watch mode (if configured)
npm test -- path/to/file.test.js      # Single file
```

## Test File Organization

**Location:**
- Backend: Tests are located in `backend/tests/`.

**Naming:**
- `*.test.js` for unit and integration tests.

**Structure:**
```
backend/
  services/
    budgetPlannerService.js
  tests/
    budgetPlanner.test.js
```

## Test Structure

**Suite Organization:**
```javascript
describe('Budget Planner', () => {
  it('should calculate budget correctly', () => {
    // arrange
    // act
    // assert
  });
});
```

**Patterns:**
- Uses standard `describe` and `it` blocks.
- `beforeEach` for setup (to be verified in `budgetPlanner.test.js`).

## Mocking

**Framework:**
- Jest built-in mocking (`jest.fn()`, `jest.mock()`).

**What to Mock:**
- Mongoose models (implied for unit tests).
- External services/APIs.

## Coverage

**Requirements:**
- No strictly enforced target found in `package.json`.

**Configuration:**
- Uses Jest's built-in coverage (accessible via `jest --coverage`).

## Test Types

**Unit/Integration Tests:**
- Focus on backend logic (e.g., `budgetPlanner.test.js`).

---

*Testing analysis: 2026-04-15*
*Update when test patterns change*
