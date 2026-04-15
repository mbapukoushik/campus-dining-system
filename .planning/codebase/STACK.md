# Technology Stack

**Analysis Date:** 2026-04-15

## Languages

**Primary:**
- JavaScript (Node.js) - Backend server, migrations, and scripts.
- JavaScript (React/Vite) - Frontend application.

**Secondary:**
- Shell (Bash) - Startup and demo scripts.
- YAML - Docker Compose infrastructure.

## Runtime

**Environment:**
- Node.js >=20.0.0 - Backend runtime.
- Web Browser - Frontend runtime.

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` present in both `backend/` and `frontend/`.

## Frameworks

**Core:**
- Express 4.19.2 - Backend web server.
- React 19.x - Frontend UI framework.
- Vite 8.x - Frontend build tool and dev server.

**Testing:**
- Jest 29.7.0 - Backend unit and integration testing.

**Database/ORM:**
- Mongoose 8.4.0 - MongoDB object modeling.
- migrate-mongo 11.0.0 - MongoDB migrations.

## Key Dependencies

**Critical:**
- passport 0.7.0 - Authentication middleware.
- jsonwebtoken 9.0.2 - JWT for session/auth.
- ioredis 5.3.2 - Redis client for caching and rate limiting.
- axios 1.14.0 - Frontend HTTP client.
- react-router-dom 7.13.2 - Frontend routing.

**Infrastructure:**
- express-rate-limit 7.3.1 - Backend rate limiting.
- cors 2.8.5 - Cross-Origin Resource Sharing.
- dotenv 16.4.5 - Environment variable management.

## Configuration

**Environment:**
- `.env` files - Managed via `dotenv`. Template provided in `.env.example`.
- `backend/.env` - Backend specific configuration.

**Build:**
- `frontend/vite.config.js` - Vite configuration.
- `backend/migrate-mongo-config.js` - Migration configuration.
- `frontend/eslint.config.js` - Linting configuration.

## Platform Requirements

**Development:**
- Docker & Docker Compose - For local MongoDB and Redis instances.
- Node.js 20+ installation.

**Production:**
- Dockerized setup (implied by `docker-compose.yml`).
- MongoDB 7.0 (Container).
- Redis Alpine (Container).

---

*Stack analysis: 2026-04-15*
*Update after major dependency changes*
