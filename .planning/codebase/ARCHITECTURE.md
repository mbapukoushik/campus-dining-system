# Architecture

**Analysis Date:** 2026-04-15

## Pattern Overview

**Overall:** Client-Server Architecture (Decoupled Frontend and Backend).

**Key Characteristics:**
- **RESTful API:** Backend exposes a JSON API for the frontend.
- **Stateless Request Handling:** Uses JWT for authentication, keeping the backend largely stateless (though sessions are available via Redis).
- **Component-Based UI:** React-based frontend with modular page and context structure.
- **Containerized Infrastructure:** Orchestrated via Docker Compose for consistent development and deployment environments.

## Layers

### Backend Layers

**Route Layer:**
- Purpose: Map HTTP endpoints to business logic.
- Location: `backend/routes/*.js`
- Contains: Route definitions (Express.Router) for auth, vendors, reviews, etc.
- Depends on: Services, Middleware.
- Used by: `backend/server.js`

**Middleware Layer:**
- Purpose: Cross-cutting concerns like auth and rate limiting.
- Location: `backend/middleware/*.js`
- Contains: `authenticate.js` for JWT verification.
- Used by: Route layer.

**Service Layer:**
- Purpose: Encapsulate business logic and data access.
- Location: `backend/services/*.js`
- Contains: Logic for vendor management, review processing, etc.
- Used by: Route layer.

**Model Layer:**
- Purpose: Define data schemas and interaction with MongoDB.
- Location: `backend/models/*.js`
- Contains: Mongoose schemas for User, Vendor, Review, etc.
- Used by: Service layer.

### Frontend Layers

**Context Layer:**
- Purpose: Manage global application state (e.g., Auth).
- Location: `frontend/src/contexts/*.jsx`
- Contains: React Context providers.
- Used by: Page layer.

**Page Layer:**
- Purpose: Present specific views to the user.
- Location: `frontend/src/pages/*.jsx`
- Contains: High-level layout and data-fetching logic.
- Used by: `frontend/src/App.jsx` (Routing).

**Service Layer (Client):**
- Purpose: Handle API communication.
- Location: `frontend/src/services/*.js`
- Contains: Axios instances and endpoint wrappers.
- Used by: Page layer and Context layer.

## Data Flow

**Typical API Request (e.g., List Vendors):**

1. **Frontend:** Page component calls service method in `src/services/vendorService.js`.
2. **Backend:** Express router in `backend/routes/vendors.js` matches the path.
3. **Backend Middleware:** `authenticate.js` verifies the user's token (if required).
4. **Backend Service:** Service in `backend/services/vendorService.js` fetches data via Mongoose models.
5. **Backend Database:** MongoDB returns the result.
6. **Backend Response:** Controller/Route handler sends JSON response.
7. **Frontend:** Axios receives response, page state updates, and React re-renders.

## Key Abstractions

**Mongoose Models:**
- Purpose: Structured data access and validation.
- Location: `backend/models/`
- Pattern: Active Record / Data Mapper (via Mongoose).

**Axios Service Wrappers:**
- Purpose: Centralized API communication logic.
- Location: `frontend/src/services/`
- Pattern: Service pattern.

## Entry Points

**Backend Entry:**
- Location: `backend/server.js`
- Responsibilities: Initialise database/redis, mount middleware, define routes, start HTTP server.

**Frontend Entry:**
- Location: `frontend/src/main.jsx` -> `frontend/src/App.jsx`
- Responsibilities: Render React tree, setup routing, provide context.

## Error Handling

**Backend Strategy:**
- Global error handler middleware in `backend/server.js` (lines 141-146).
- Exception bubbling from services/routes to the global handler.

**Frontend Strategy:**
- Error states in page components.
- Response interceptors in Axios (implied, to be verified).

---

*Architecture analysis: 2026-04-15*
*Update when major patterns change*
