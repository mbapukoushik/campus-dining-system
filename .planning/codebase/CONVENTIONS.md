# Coding Conventions

**Analysis Date:** 2026-04-15

## Naming Patterns

**Files:**
- `kebab-case.js` for all backend files.
- `PascalCase.jsx` for all React frontend components.
- `*.test.js` for test files.

**Functions:**
- `camelCase` for all functions.
- `handlerName` for event handlers.
- `async` prefix for asynchronous functions is not strictly enforced, but `await` is used throughout.

**Variables:**
- `camelCase` for variables.
- `UPPER_SNAKE_CASE` for constants.
- No `_` (underscore) prefix for private variables is used.

## Code Style

**Formatting:**
- Indentation: 2 spaces.
- Semicolons: Required.
- Quotes: Single quotes preferred for JavaScript.

**Linting:**
- ESLint with `eslint.config.js`.
- Run: `npm run lint`.

## Error Handling

**Patterns:**
- `try/catch` wrapping for asynchronous logic.
- Exception bubbling to the global Express error handler.
- Specific checks for error names (e.g., `err.name === 'TokenExpiredError'`).

**Error Responses:**
- Return `res.status(N).json({ error: 'message' })`.

## Logging

**Backend:**
- `console.log` for server startup and status.
- `console.error` for errors within handlers.

## Function Design

**Async/Await:**
- Heavy use of `async/await` for database/redis operations.
- Avoid `.then()/.catch()` chains.

## Module Design

**CommonJS (Backend):**
- Use `require()` and `module.exports`.

**ES Modules (Frontend):**
- Use `import` and `export`.
- `export default` for page components.

---

*Convention analysis: 2026-04-15*
*Update when patterns change*
