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
