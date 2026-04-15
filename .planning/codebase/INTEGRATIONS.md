# External Integrations

**Analysis Date:** 2026-04-15

## APIs & External Services

**Authentication:**
- Google OAuth 2.0 - Social sign-in for students/staff.
  - SDK/Client: `passport-google-oauth20`
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in `.env`.
  - Scopes: `profile`, `email`.

## Data Storage

**Databases:**
- MongoDB 7.0 (Local/Docker) - Primary data store.
  - Connection: `MONGODB_URI` env var.
  - Client: `Mongoose 8.4.0`.
  - Migrations: `migrate-mongo` in `backend/migrations/`.

**Caching:**
- Redis Alpine (Local/Docker) - Session storage and rate limiting.
  - Connection: `REDIS_URL` or individual components (`REDIS_HOST`, `REDIS_PORT`).
  - Client: `ioredis v5.3.2`.

## Authentication & Identity

**Auth Provider:**
- Custom JWT + Passport - Hybrid strategy.
  - Implementation: Passport strategies (Local, Google) and JWT sign/verify.
  - Token storage: `httpOnly` cookies (via `cookie-parser`).
  - Session management: `express-session` with Redis store (`rate-limit-redis` uses it).

## Monitoring & Observability

**Logs:**
- Standard output (stdout) - Handled by Node.js and Docker.

## CI/CD & Deployment

**Hosting:**
- Docker Compose - Orchestrates backend, frontend, mongodb, and redis.
- Build/Run: `start_demo.sh` / `start_demo.bat` scripts for local deployment.

## Environment Configuration

**Development:**
- Required env vars:
  - `PORT`: Backend port.
  - `MONGODB_URI`: MongoDB connection string.
  - `JWT_SECRET`: Secret for signing tokens.
  - `GOOGLE_CLIENT_ID`: OAuth client ID.
  - `GOOGLE_CLIENT_SECRET`: OAuth client secret.
  - `SESSION_SECRET`: Secret for session cookies.
- Secrets location: `.env` file (gitignored, template in `.env.example`).

---

*Integration audit: 2026-04-15*
*Update when adding/removing external services*
