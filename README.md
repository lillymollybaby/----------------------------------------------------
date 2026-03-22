# FlowTask

A progressive web app for managing tasks. Works offline, syncs when you're back online, and can be installed on your phone like a native app.

## Tech stack

| Part | Technology |
|------|-----------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| PWA | vite-plugin-pwa (Workbox) |
| State | Zustand + React Query |
| Drag & drop | dnd-kit |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| Offline storage | IndexedDB (idb) |
| Deploy | Vercel |

## Features

- JWT auth with token refresh
- Kanban board with drag & drop
- Offline mode — tasks load from cache, edits queue up and sync automatically
- PWA — installable on mobile and desktop
- Dashboard with activity chart
- Tag-based filtering
- Responsive design

## Running locally

**Prerequisites:** Node 18+, PostgreSQL database (or use [Neon](https://neon.tech) for free)

```bash
git clone <repo-url>
cd flowtask
```

### Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT secrets, FRONTEND_URL

npm install
npm run db:push        # Create tables
npm run dev            # Starts on http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000

npm install
npm run dev            # Starts on http://localhost:5173
```

### Running tests

```bash
cd backend
npm test
```

## Deploying to Vercel

### Backend

1. Create a new Vercel project from the `backend/` directory
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` — your Neon/Supabase PostgreSQL URL
   - `JWT_ACCESS_SECRET` — any random string
   - `JWT_REFRESH_SECRET` — another random string
   - `FRONTEND_URL` — your frontend Vercel URL
3. After first deploy, run `npx prisma db push` locally pointing to production DB to create tables

### Frontend

1. Create a new Vercel project from the `frontend/` directory
2. Set environment variable:
   - `VITE_API_URL` — your backend Vercel URL (e.g. `https://flowtask-api.vercel.app`)

### Icons

Before deploying, add your icons to `frontend/public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `apple-touch-icon.png` (180×180)

You can generate them at [realfavicongenerator.net](https://realfavicongenerator.net).

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/me` | Update profile / password |
| GET | `/api/tasks` | List tasks (filterable) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get single task |
| PATCH | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Change status |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats/summary` | Dashboard stats |
| GET | `/api/tags` | List tags |
| POST | `/api/tags` | Create tag |
| PATCH | `/api/tags/:id` | Update tag |
| DELETE | `/api/tags/:id` | Delete tag |
