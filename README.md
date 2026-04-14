# Smart Advisor System — Norfolk State University

Academic advising platform for the CS General program. Students track degree progress, plan courses, and get advisor review and approval.

---

## Prerequisites

- **Python 3.12+** — for the backend
- **Node.js 18+** — for the frontend
- **pnpm** — install with `npm install -g pnpm`
- **PostgreSQL** — any hosted PostgreSQL service works (Supabase, Neon, Railway, etc.)

---

## Environment Variables

Create a `.env` file inside `artifacts/api-server/`:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
SESSION_SECRET=your-random-secret-string-here
PORT=8080
```

- `DATABASE_URL` — your PostgreSQL connection string
- `SESSION_SECRET` — any long random string (used to sign session cookies)
- `PORT` — port the API server listens on (default: 8080)

---

## Database Setup

The backend auto-creates all tables on first startup. To also seed the demo data (courses, users), run the seed script once:

```bash
cd artifacts/api-server
pip install -r requirements.txt
python seed.py
```

---

## Running the Backend

```bash
cd artifacts/api-server
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

The API will be available at `http://localhost:8080/api`

**For production** (no `--reload`):
```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```

---

## Running the Frontend

```bash
# From the project root
pnpm install
pnpm --filter @workspace/smart-advisor run dev
```

The frontend will be available at `http://localhost:5173`

**For production build:**
```bash
pnpm --filter @workspace/smart-advisor run build
# Serve the output at artifacts/smart-advisor/dist/
```

---

## Running Both Together (Development)

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd artifacts/api-server
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/smart-advisor run dev
```

Then open `http://localhost:5173` in your browser.

---

## Demo Accounts

| Role    | Username   | Password     | Name              |
|---------|------------|--------------|-------------------|
| Advisor | `advisor1` | `advisor123` | Dr. Abdulgader Musbah |
| Student | `jlee`     | `student123` | Jayson Lee        |
| Student | `mwarren`  | `student123` | Malcolm Warren    |
| Student | `ashavers` | `student123` | Arriel Shavers    |

---

## Project Structure

```
artifacts/
  api-server/         Backend (Python + FastAPI)
    main.py             FastAPI app entry point
    database.py         SQLAlchemy database connection
    models.py           Database models
    routers/            Route handlers
      auth.py             Login / logout / session
      students.py         Student records
      courses.py          Course catalog
      progress.py         Degree progress tracking
      plans.py            Course planning & advisor actions
      dashboard.py        Dashboard summaries
    deps.py             Shared auth & access-control helpers
    seed.py             Database seed script (demo data)
    requirements.txt    Python dependencies

  smart-advisor/      Frontend (React + Vite + TypeScript)
    src/
      pages/
        login.tsx
        student/          Student-facing pages
        advisor/          Advisor-facing pages
      components/         Shared UI components

lib/
  api-spec/           OpenAPI spec (source of truth for the API)
  api-client-react/   Auto-generated React Query hooks
```

---

## Deploying to Production

The backend and frontend can be hosted separately:

- **Backend**: any Python host (Railway, Render, Fly.io, etc.)
  - Set `DATABASE_URL` and `SESSION_SECRET` as environment variables
  - Run: `uvicorn main:app --host 0.0.0.0 --port $PORT`

- **Frontend**: any static host (Vercel, Netlify, GitHub Pages, etc.)
  - Build: `pnpm --filter @workspace/smart-advisor run build`
  - The built files are at `artifacts/smart-advisor/dist/`
  - Set the API base URL in your Vite config if your backend is on a different domain
