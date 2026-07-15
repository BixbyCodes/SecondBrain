# 🚀 Module 7 — Deployment (Going Live)
### Vercel · Render · Atlas · environment-driven config

> **What this covers:** how I took the app off my laptop and put it **live on the internet** with a real URL — the three pieces, where each is hosted and *why*, the config it took, and the gotchas. Live at: frontend on Vercel → backend on Render → MongoDB Atlas.

---

## 🧩 At a glance

| Piece | Hosted on | Why there |
|-------|-----------|-----------|
| **Frontend** (React/Vite) | **Vercel** | Best for static sites; free; instant builds |
| **Backend** (Express + Socket.IO) | **Render** | A *persistent* Node server — needed for WebSockets |
| **Database** | **MongoDB Atlas** | Already in the cloud — nothing to deploy |

> 🎯 **The one-liner:** *"The frontend is a static build on Vercel, the backend is a persistent Node service on Render, and the database is MongoDB Atlas. The frontend learns the backend's URL from a build-time env variable, and the backend reads its secrets and allowed origin from runtime env variables."*

---

## 🌍 The big picture: 3 pieces, 3 homes

A full-stack app isn't one thing you "deploy" — it's **separate pieces that each need a home**, then wired together:
- The **frontend** is just static files (HTML/CSS/JS) after `vite build` → any static host serves them.
- The **backend** is a running program that must stay alive to answer requests *and* hold WebSocket connections open.
- The **database** was already cloud-hosted (Atlas), so it needed nothing.

## ⚠️ Why not put *everything* on Vercel?
Vercel is perfect for the frontend, but it runs the backend as **serverless functions** — short-lived and stateless. My app uses **WebSockets** (Socket.IO for real-time), which need a connection that **stays open**. Serverless can't do that. So the backend needs a host that runs an **always-on server**: Render (I used it), Railway, or Fly.io.

> **The rule:** static frontend → anywhere. Backend *with WebSockets / long-lived connections* → a persistent server host, not serverless.

---

## 🔧 The prep: making the code environment-aware

Locally, everything pointed at `localhost`. That doesn't exist in production. The fix is **environment variables** — the same code reads different values per environment.

**Frontend → `VITE_API_URL`.** I put the backend's base URL in one config file:
```ts
// client/src/config.ts
export const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
```
Every `fetch` and the socket connection use `API`. Locally it falls back to localhost; on Vercel I set `VITE_API_URL` to the Render URL.

**Backend → `CLIENT_URL`, `PORT`, and secrets.**
- Socket.IO's allowed origin reads `CLIENT_URL` (the Vercel URL) so the deployed frontend can connect.
- The server already used `process.env.PORT || 3000` — Render sets `PORT` for you.
- `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY` are set in Render's dashboard (never committed).

> 🧠 **Build-time vs runtime (important):** Vite **bakes `VITE_` variables into the bundle at build time** — so `VITE_API_URL` must be set *before* Vercel builds. The backend reads `process.env` **at runtime**, so Render can change those without a rebuild. Different timing, different behavior.

---

## ☁️ Deploying the backend (Render)
A **Web Service** from my GitHub repo, configured for the monorepo:
- **Root Directory:** `server` (the backend lives in a subfolder)
- **Build Command:** `npm install && npm run build` — installs deps *and* compiles TS → `dist/`
- **Start Command:** `npm start` → `node dist/index.js` (the *compiled* entry, not the `.ts`)
- **Instance:** Free
- **Env vars:** `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLIENT_URL`

## ▲ Deploying the frontend (Vercel)
Import the repo, and:
- **Root Directory:** `client`
- **Framework:** Vite (auto-detected) → `vite build` → static `dist/`
- **Env var:** `VITE_API_URL` = the Render backend URL (no trailing slash)

## 🔌 Wiring them together
- On Render, `CLIENT_URL` = the Vercel URL (**no trailing slash** — the browser's `Origin` header has none, and Socket.IO matches it exactly).
- On Atlas, **Network Access → allow `0.0.0.0/0`** so Render's (changing) IPs can connect.

---

## 🏗️ Why the "does it build?" check mattered
In dev I run with **`tsx`** (backend) and Vite's dev server — both **skip strict type-checking** for speed. But the *production* build runs **`tsc`**, which *does* type-check and **fails on type errors.** So code that "works" in dev can break the deploy. I ran `npm run build` on both **before** deploying to catch that early. (Both built clean.)

## 😴 Cold starts (the free-tier trade-off)
Render's free instance **sleeps after ~15 minutes idle.** The next request has to **wake it (~30–60s)** — which is why the AI chat hung on "Thinking…" on the first try after a while. Once awake, it's fast. Fixes: a paid always-on instance, or a keep-alive ping — not worth it for a portfolio.

---

## 🐞 Gotchas I hit (and the fixes)

- **Build command was just `npm install`** → the TS never compiled, so `dist/` was empty. Fix: `npm install && npm run build`.
- **Start command pointed at `index.js`** → there's no such file at the root; the compiled entry is `dist/index.js`. Fix: `npm start`.
- **Instance defaulted to a paid tier** → switched to **Free**.
- **Trailing slash on `CLIENT_URL`** would break Socket.IO CORS (origin match is exact).
- **Secrets** go in the host dashboard, **never** in the repo (`.env` stays git-ignored).

---

## 💬 Questions they might ask

**"How did you deploy it?"** — Frontend static build on Vercel, backend as a persistent Node service on Render, database on Atlas. They're wired with environment variables.

**"Why not host the backend on Vercel too?"** — It uses WebSockets, which need a long-lived connection; Vercel's serverless functions are short-lived, so I used Render (a persistent server host).

**"How does the frontend know the backend's URL?"** — A build-time env var, `VITE_API_URL`; the code reads it and falls back to localhost in dev.

**"Build-time vs runtime env vars?"** — Vite bakes `VITE_` vars into the bundle at build; the Node backend reads `process.env` at runtime. So frontend vars need a rebuild to change; backend ones don't.

**"How do you handle CORS in production?"** — The backend's allowed origin (for Express and Socket.IO) is set to the real frontend URL via an env var, instead of localhost.

**"What's a cold start?"** — On a free/serverless tier the server sleeps when idle; the first request after that has to boot it, adding latency.

**"How do you keep secrets out of the repo?"** — They live in the hosting dashboards' env settings; `.env` is git-ignored; only a `.env.example` (no values) is committed.

---

## 🧠 The short version to remember

Three pieces, three homes: **frontend → Vercel** (static build), **backend → Render** (persistent server, because WebSockets need a live connection Vercel's serverless can't hold), **DB → Atlas**. The glue is **env variables**: the frontend gets the backend URL from **`VITE_API_URL`** (baked in at build), and the backend reads its secrets + allowed origin (**`CLIENT_URL`**) at runtime. I verified both **build** cleanly first (prod uses `tsc`, which type-checks unlike dev's `tsx`). Free tiers **sleep** → first request is a slow cold start. **The app is live at a real URL.**
