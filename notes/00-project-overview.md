# 🧠 Second Brain — Project Overview
### An AI-powered notes app · MERN + TypeScript + RAG

> **Read this first.** It's the whole project on one page: what it is, why it exists, the tech and *why* each piece is there, and how data flows through it (with diagrams). Everything else in this folder is a deep-dive on one module.

---

## 🎯 What it is (the elevator pitch)

**Second Brain** is a full-stack web app where a user can capture personal notes **and chat with them using AI.** You ask a question in plain English — *"what did I write about going fast?"* — and an AI answers using **your own notes**, not the public internet.

It's a real, multi-user product: sign up, log in, manage your private notes, and talk to them. Built from scratch, every layer understood.

---

## ❓ The problem it solves

Notes pile up and become a graveyard — you *know* you wrote something, but you can't find it. Normal search only matches **keywords**: search "speed" and you'll miss a note titled "going fast," even though they mean the same thing.

**The fix:** let people ask questions in natural language and get answers grounded in their own writing — searching by **meaning**, not exact words.

```
❌ Plain search:  "speed"  →  misses the note titled "going fast"
❌ Plain AI:      ask an LLM  →  it doesn't know your notes (or invents an answer)
✅ This app:      find YOUR relevant notes  →  hand them to the AI  →  real, grounded answer
```

---

## 🧰 The tech stack (and *why* each piece)

| Layer | Tech | Why it's here |
|-------|------|---------------|
| **Database** | MongoDB (Atlas cloud) | Stores JSON-like documents; flexible; pairs with JS. Atlas adds **Vector Search** for the AI. |
| **Backend** | Node.js + Express | Runs JS on the server; Express gives clean routing + middleware. |
| **Frontend** | React + Vite | Component-based UI; Vite = fast dev server. |
| **Language** | TypeScript (everywhere) | Static types catch bugs before runtime; safer as it grows. |
| **Auth** | JWT + bcrypt | bcrypt hashes passwords; JWT = stateless login "wristband." |
| **AI** | Google Gemini | LLM for answers + embeddings for meaning-search (free tier). Provider-swappable. |
| **Data modeling** | Mongoose | Schemas + validation + a clean query API over MongoDB. |
| **Version control** | Git + GitHub | Backup + history; secrets kept out via `.gitignore`. |

---

## 🏗️ Architecture — the big picture

Two separate apps (client + server) talking over HTTP, plus a database and an AI service:

```
   ┌──────────────┐    HTTP / JSON    ┌────────────────────┐    ┌──────────────────┐
   │   BROWSER    │ <===============> │       SERVER       │<==>│  MongoDB Atlas   │
   │  React+Vite  │   (+ JWT token)   │ Express+Node+TS    │    │  notes / users   │
   │  :5173       │                   │  :3000  (REST API) │    │  + Vector Search │
   └──────────────┘                   └─────────┬──────────┘    └──────────────────┘
                                                │
                                                │  (AI features only)
                                                ▼
                                       ┌────────────────────┐
                                       │    Gemini API      │
                                       │ LLM + embeddings   │
                                       └────────────────────┘
```

- **The browser** draws the UI and *sends requests*.
- **The server** receives them, checks auth, talks to the DB and (for AI) to Gemini, and *responds with JSON*.
- **The database** is long-term memory. **Gemini** is the smart helper.

---

## 🔄 Data flow — a request's journey

**Creating a note** (the classic loop):
```
You type a note  →  React: POST /notes (+ JWT)  →  Express receives
      →  middleware verifies the JWT (who are you?)
      →  Mongoose validates + saves to MongoDB
      →  server returns the saved note (with _id, timestamps)
      →  React drops it into the list  →  it appears on screen
```
*Every feature is a version of:* **client asks → server (with DB / AI) answers → client shows it.**

**Chatting with your notes** (RAG — Retrieve, Augment, Generate):
```
You ask: "what did I write about speed?"
   │
   ▼  [1] RETRIEVE   embed the question → vector-search your notes → the few most relevant
   │
   ▼  [2] AUGMENT    build a prompt: instructions + those notes + your question
   │
   ▼  [3] GENERATE   send to Gemini → answer grounded in YOUR notes
   │
   ▼  answer appears in the chat box
```

---

## 🔐 Auth flow (who are you, and what can you touch?)

```
REGISTER   email + password  →  bcrypt HASHES the password  →  store user (never the raw password)
LOGIN      email + password  →  hash & compare  →  match? issue a JWT (a signed "wristband")
REQUEST    send JWT in header →  middleware verifies the signature  →  allowed ✅ / 401 ❌
OWNERSHIP  every note has an owner  →  queries are scoped to the logged-in user (you see only yours)
```

---

## ✨ Key features
- 🔐 Sign up, log in, secure JWT auth
- 📝 Per-user notes — create, read, update, delete (only your own)
- ⚛️ A React UI to use it all
- 🧠 **Chat with your notes** — AI answers grounded in your content (RAG)
- 🔍 *(in progress)* semantic search via embeddings + vector search

---

## 📁 Project structure
```
merevision/
├── server/          # backend (Express + TS)
│   └── src/
│       ├── index.ts        # app setup, middleware, route mounting, DB connect
│       ├── models/         # Mongoose schemas (Note, User)
│       ├── routes/         # noteRoutes, authRoutes, aiRoutes
│       ├── middleware/     # protect (JWT auth)
│       └── lib/            # helpers (e.g. embeddings)
├── client/          # frontend (React + Vite + TS)
│   └── src/
│       ├── App.tsx         # login + which screen to show
│       └── components/     # Notes, Chat
└── notes/           # these study notes
```

---

## 🗺️ How it was built (module map)

| Module | What | Status |
|--------|------|--------|
| 0 | Foundations & mental model | ✅ |
| 1 | Backend: Node + Express + TypeScript | ✅ |
| 2 | Data: MongoDB, Mongoose, CRUD API | ✅ |
| 3 | Auth: bcrypt, JWT, protected + owner-scoped routes | ✅ |
| 4 | Frontend: React (login, notes, chat UI) | ✅ core |
| 5 | AI layer: chat with your notes (RAG) | 🔨 embeddings finale left |
| 6 | Real-time (WebSockets), polish | ⬜ |
| 7 | Testing, security, deployment (go live) | ⬜ |
| 8 | Performance & scaling | ⬜ |

---

## 🎤 The 60-second interview pitch

> *"Second Brain is a full-stack AI notes app I built with the MERN stack and TypeScript. The backend is a REST API in Express with MongoDB; auth uses bcrypt-hashed passwords and JWTs, and every note is scoped to its owner. The frontend is React. The standout feature is 'chat with your notes' — a RAG pipeline: I embed the notes, and when the user asks a question I retrieve the most relevant ones with vector search, put them in a prompt, and have an LLM answer grounded in the user's own data. I built and understand every layer, from the database schema to the React component to the AI pipeline."*
