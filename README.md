# Bloom-Care

Bloom-Care is a medicine availability platform. The project specification and `docs/ARCHITECTURE.md` are the authoritative sources of truth.

## Project structure

- `frontend/` — React + TypeScript + Vite + Tailwind CSS client
- `backend/` — Node.js + Express + MongoDB/Mongoose server
- `docs/ARCHITECTURE.md` — architecture and implementation contracts

## Phase 1 foundation

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend environment file is based on `frontend/.env.example`.

### Backend

```bash
cd backend
npm install
npm run dev
```

Copy `backend/.env.example` to `.env` and provide a MongoDB connection string when database connectivity is required. No secrets belong in Git.

## Authority

Do not add or change product behavior without first checking the project specification and `docs/ARCHITECTURE.md`.

## Deployment

Bloom-Care runs as two separately deployed services:

- **Backend** (Render, or any Node host): build command `npm install`, start command `npm start`. Required environment variables — see `backend/.env.example` for the full list with descriptions: `PORT` (most hosts, including Render, set this automatically), `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `GEOAPIFY_API_KEY`, `CORS_ORIGIN` (set to the deployed frontend's exact origin, no trailing slash — comma-separated if more than one is needed). In production (`NODE_ENV=production`, which Render sets automatically), the server fails fast at startup if `MONGODB_URI` is missing, rather than starting in a broken state.
- **Frontend** (Vercel, or any static host that supports SPA rewrites): build command `npm run build`, output directory `dist`. Required environment variable — see `frontend/.env.example`: `VITE_API_BASE_URL` (the backend's deployed URL, including `/api`). `vercel.json` provides the SPA rewrite (`/(.*)` → `/index.html`) needed for client-side routing to work on refresh/direct navigation; this must be preserved if the hosting platform changes.
