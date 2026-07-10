# Module 1 — Backend Foundations (Node, Express & TypeScript)

> **Project:** Second Brain — an AI-powered notes app (MERN + TypeScript).
> This note covers the server foundation: Node, Express, TypeScript, HTTP, and the request/response cycle.
>
> *(This is the "reference / README" style — compact, scannable, table-heavy. Compare it with the flowing "study-guide" style in `module-01-backend-foundations.md`.)*

---

## 🎤 60-second "explain it" script (for the interview)

> "The backend is a REST API built with **Node.js** and **Express**, written in **TypeScript**. Express handles routing — it maps incoming HTTP requests (like `GET /notes`) to handler functions. TypeScript gives me static typing so I catch bugs at compile time instead of at runtime. In development I run it with `tsx`, which executes TypeScript directly and hot-reloads on save. The server exposes JSON endpoints that the React frontend consumes over HTTP."

---

## 🧠 The core mental model: request → response

Everything a web app does is two computers passing notes:

```
Client (browser / React)  ──HTTP request──▶  Server (Express / Node)
                                                   │ (talks to DB if needed)
Client renders the data   ◀──HTTP response──       ▼
```

The full relay for real features: **client → server → database → server → client.**
Every endpoint I build is a variation of this one loop.

---

## 🔑 Key concepts & the *why*

| Thing | What it is | Why we use it |
|---|---|---|
| **Node.js** | A runtime that runs JavaScript *outside* the browser | Lets me write the server in JS/TS — one language across the stack |
| **Express** | A minimal web framework for Node | Raw Node's `http` module is low-level & verbose; Express gives clean routing + middleware |
| **TypeScript** | JavaScript + static types (compiles to JS) | Catches type errors before running, autocomplete, self-documenting code, safer refactors |
| **tsx** | Runs `.ts` files directly, with watch/reload | Fast dev loop — no manual compile step |
| **REST API** | A convention: *resources* + HTTP *methods* | Predictable, standard way for client & server to talk |

**Node.js deeper (common Q):** Node is *single-threaded* and uses an *event loop* with *non-blocking I/O*. That makes it great for I/O-heavy work (APIs, DB calls) because it doesn't sit idle waiting — it handles other requests while waiting on I/O.

---

## ⚙️ How the server actually works

Entry file: `server/src/index.ts`

1. `const app = express()` → create the app.
2. `app.use(express.json())` → **middleware** that parses JSON request bodies into `req.body`.
3. Register routes: `app.get("/health", (req, res) => res.json({ status: "ok" }))`.
4. Connect to the database, then `app.listen(PORT)` → start accepting requests.

**Key insight — registering a route ≠ running code now.**
`app.get("/x", handler)` tells Express: *"remember this — whenever a GET request hits `/x` in the future, run `handler`."* The handler runs **once per request**, and that's when Express hands you **`req`** (the request) and **`res`** (your way to reply).

```ts
import express from "express";
const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });   // res.json sets Content-Type: application/json
});

app.listen(3000, () => console.log("Server on http://localhost:3000"));
```

**`res.send` vs `res.json`:** `res.json(obj)` serializes an object to JSON *and* sets the `application/json` header. Use it for API data.

---

## 🧩 What is "middleware"? (near-guaranteed question)

A **middleware** is a function that runs on the request **before** it reaches your route handler — like a checkpoint every request passes through. It can read/modify `req`/`res`, or end the request. Signature: `(req, res, next) => {}`; calling `next()` passes control on.

Example I use: `express.json()` — reads the incoming JSON body and attaches it to `req.body`. **Without it, `req.body` is `undefined`** (a classic bug).

---

## 🔧 How would you change / extend this?

- **Add an endpoint:** register another route (`app.post(...)`).
- **Config via environment:** read `process.env.X` (with `dotenv`) instead of hard-coding.
- **Add CORS:** `app.use(cors())` so the browser frontend (different origin) can call the API.
- **Add logging:** a middleware like `morgan`, or a custom `(req,res,next)` logger.
- **Add rate limiting / helmet** for production hardening.

---

## 💬 Likely interview Q&A

**Q: Difference between client and server?**
The client is the *program* making requests (browser/React). The server is the *program* that receives them, does logic, talks to the DB, and responds. I wrote both.

**Q: What are `req` and `res`?**
Objects Express passes to a route handler. `req` = the incoming request (body, params, query, headers). `res` = the tools to send a response (`res.json`, `res.status`, etc.).

**Q: Why TypeScript over plain JS?**
Static typing catches whole classes of bugs at compile time, gives better tooling/autocomplete, and documents intent. It compiles down to JS to run.

**Q: Is Node multi-threaded?**
The JS execution is single-threaded with an event loop; I/O is non-blocking. Great for concurrent I/O-bound workloads.

**Q: What is a REST API?**
An architectural style where you expose *resources* (e.g. notes) and use HTTP *methods* (GET/POST/PATCH/DELETE) to act on them, with meaningful status codes.

---

## 🐞 Debugging war story (shows depth)

I hit `req.body is undefined` when handling a POST — the fix was adding `app.use(express.json())`. Lesson: Express doesn't parse JSON bodies by default; you must enable the middleware. This taught me that middleware runs *before* handlers and shapes what the handler receives.
