# Codebase Structure

**Analysis Date:** 2026-04-15

## Directory Layout

```
campus-dining-system/
├── backend/                # Node.js Express server
│   ├── config/             # DB, Redis, Passport config
│   ├── middleware/         # Custom Express middleware
│   ├── migrations/         # MongoDB migrations
│   ├── models/             # Mongoose schemas/models
│   ├── routes/             # API route definitions
│   ├── scripts/            # Setup and seeding scripts
│   ├── services/           # Business logic services
│   ├── tests/              # Jest test suites
│   └── server.js           # Server entry point
├── frontend/               # React Vite application
│   ├── public/             # Static assets
│   ├── src/                # React source code
│   │   ├── assets/         # Images, styles
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client services
│   │   ├── App.jsx         # Main routing
│   │   └── main.jsx        # Frontend entry point
│   ├── index.html          # HTML template
│   └── vite.config.js      # Vite configuration
├── docker-compose.yml      # Infrastructure orchestration
├── start_demo.sh           # Linux startup script
└── start_demo.bat          # Windows startup script
```

## Directory Purposes

**backend/**
- Purpose: Primary backend server logic.
- Contains: Node.js modules, Express server, and database interaction logic.
- Key files: `server.js` (Entry point), `package.json`.

**backend/routes/**
- Purpose: API endpoint definitions.
- Contains: Express Router modules.
- Key files: `auth.js`, `vendors.js`, `menu.js`, `reviews.js`.

**backend/models/**
- Purpose: MongoDB data structure definitions.
- Contains: Mongoose schemas.
- Key files: `User.js`, `Vendor.js`, `Review.js` (implied).

**frontend/src/pages/**
- Purpose: UI views and page-level logic.
- Contains: React components for different pages.

**frontend/src/services/**
- Purpose: Frontend API communication.
- Contains: Axios client and endpoint service wrappers.

## Key File Locations

**Entry Points:**
- `backend/server.js`: Node.js server entry point.
- `frontend/src/main.jsx`: React application entry point.

**Configuration:**
- `backend/config/`: DB, Redis, and Passport initialisation.
- `frontend/vite.config.js`: Vite build and dev server config.
- `.env.example`: Environment variable template.

**Infrastructure:**
- `docker-compose.yml`: MongoDB and Redis container definitions.

## Naming Conventions

**Files:**
- `kebab-case.js`: Backend routes, services, and middlewares.
- `PascalCase.jsx`: React components (Pages).
- `*.test.js`: Jest test files in `backend/tests/`.

**Directories:**
- `plural-name`: Used for collections like `routes`, `models`, `services`, `pages`.

## Where to Add New Code

**New Backend API:**
- Route: `backend/routes/`
- Service: `backend/services/`
- Model (if new entity): `backend/models/`
- Test: `backend/tests/`

**New Frontend Page:**
- Component: `frontend/src/pages/`
- Service: `frontend/src/services/`
- Route: `frontend/src/App.jsx`

---

*Structure analysis: 2026-04-15*
*Update when directory structure changes*
