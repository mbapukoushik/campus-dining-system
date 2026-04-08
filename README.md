# Campus Dining & Vendor Quality Management System
## SRM University AP — Amaravati Campus

### 1. Project Overview
This repository contains the "Campus Dining & Vendor Quality Management System" implementation for SRM University AP. It is built as a highly resilient, full-stack application leveraging Node.js, Express, MongoDB, and Redis to manage campus food vendors, quality reviews, real-time wait times, and meal budget planning.

### 2. Core Architecture
- **Backend**: Node.js v20+, Express with Redis-backed rate limiting.
- **Database**: MongoDB with Mongoose (UUID v4 primary keys).
- **Caching**: Redis singleton (ioredis) for session and high-frequency rate limiting.
- **Frontend**: Vite-based React application with a light-mode academic aesthetic.

### 3. Installation (WSL2 / Linux Preferred)
Follow these steps to set up the development environment:

```bash
# 1. Clone the repository
git clone https://github.com/mbapukoushik/campus-dining-system.git
cd campus-dining-system

# 2. Setup Backend
cd backend
npm install
cp .env.example .env  # Update with your MONGO_URI, REDIS_URI, and OAuth keys

# 3. Initialise Database
npm run migrate:up
node scripts/seeder.js

# 4. Start Backend
npm run dev

# 5. Setup Frontend (separate terminal)
cd ../frontend
npm install
npm run dev
```

### 4. Key Functional Features
- **University OAuth**: Restricted access to @srmap.edu.in domains.
- **Smart Budget Planner**: Algorithm-driven meal recommendations based on median category pricing.
- **Quality Feedback**: Student-driven vendor rating system with ownership guards.
- **Admin Mission Control**: Global dashboard for monitoring vendor status and blocking non-compliant stalls.

### 5. Repository Structure
- `/backend`: API core, models, and middleware.
- `/frontend`: React client with centralized auth context.
- `/migrations`: Database schema versioning history.

---
*Developed for SRM University AP Engineering Curriculum.*
