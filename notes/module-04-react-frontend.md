# ⚛️ Module 4 — The Frontend (React)
### React · Vite · Components · State · Talking to your API

> **What this covers:** how I built the *face* of the app — a React interface where users log in and manage their notes, talking to the backend API I built earlier. This is the "client" half of the stack.

---

## 🧩 The frontend toolkit at a glance

| Piece | In one line | Why it's here |
|-------|-------------|---------------|
| **React** | Builds UI from reusable components | I describe the UI for a given state; React keeps the screen in sync |
| **Vite** | Dev server + build tool | Instant hot-reload while developing |
| **useState** | Holds data that drives the UI | When it changes, React re-renders |
| **useEffect** | Runs code when a component loads | Used to fetch data on mount |
| **fetch** | Calls the backend API from the browser | The browser's version of curl |

> 🎯 **One-liner to say in an interview:**
> *"The frontend is a React app (Vite + TypeScript) that talks to my Express API over HTTP. It handles login, stores the JWT, and sends it on every request so users see only their own notes."*

---

## 🌍 The big picture: the client wakes up

For three modules, everything was backend — I could only talk to it with `curl`. The frontend is the **client**: the program that runs in the browser, draws the screen, and *sends the requests*. It's a completely separate app from the server — its own folder (`client/`), its own dev server (port `5173`), talking to the backend (port `3000`) over HTTP.

---

## ⚛️ React basics: components, JSX & the render loop

A **component** is just a function that returns UI. I build screens by combining small components like LEGO — `App`, `Notes`, and so on. The HTML-looking markup inside is **JSX** — HTML written *inside* JavaScript, where `{ }` drops live JavaScript into the markup (e.g. `{note.title}`).

The single most important idea in React:

> 🔁 **The render loop:** the user does something → I call a `setX` function → state changes → **React automatically re-renders** and updates the screen. I never touch the DOM directly like in plain JS — I just change state, and React keeps the screen in sync. *I describe what the UI should look like for a given state; React handles the rest.*

---

## 🎛️ State — `useState`

`const [notes, setNotes] = useState([])` creates a piece of state: `notes` is the current value, `setNotes` is the only way to change it, and changing it re-renders the component. I used state for the login fields, the list of notes, and the new-note form.

One rule that matters: **never mutate state directly.** To add a note I wrote `setNotes([newNote, ...notes])` — a *brand-new array*, not `notes.push(...)`. React only re-renders when it sees a new value, so you always replace, never mutate.

---

## 📨 Props — passing data to a child component

**Props** are how a parent passes data down to a child. My `App` passes the token and a logout function down: `<Notes token={token} onLogout={handleLogout} />`. Inside `Notes`, they arrive as the function's parameter (`{ token, onLogout }`). Data flows one way: down, from parent to child.

---

## ⏳ `useEffect` — running code when a component appears

I can't just call `fetch` in the middle of a component — it would run on every render (an infinite loop). `useEffect` controls *when* side effects happen. `useEffect(() => { fetchNotes() }, [])` — the empty `[]` means "run once, when this component first appears." That's where I load the user's notes.

---

## 📝 Controlled inputs & forms

Every input is **controlled**: its `value` comes from state, and `onChange` writes back to state on every keystroke — so React is the single source of truth for what's in the box. Forms use `onSubmit` plus **`e.preventDefault()`**, which stops the browser's default behavior of reloading the whole page (ancient web behavior we never want in a React app).

---

## 🌐 Talking to the backend: fetch, CORS & the JWT

The frontend calls the API with **`fetch`**. For login I POST the email and password; the server returns a JWT, and I save it in **`localStorage`** (a browser storage box that survives refreshes). On every protected request — fetching or creating notes — I send that token in a header: **`Authorization: Bearer <token>`**. That's the wristband my Module 3 middleware verifies.

One gotcha I had to solve: **CORS.** The browser blocks a page on `localhost:5173` from calling an API on `localhost:3000` (a different origin) unless the server allows it. I added the `cors()` middleware to Express to permit it.

---

## 🔄 How the whole app flows

1. User logs in → `fetch` POST `/auth/login` → server returns a JWT → I save it in `localStorage` **and** in state.
2. Because the token is now in state, `App` re-renders and shows the `<Notes>` screen instead of the login form (**conditional rendering**).
3. `<Notes>` mounts → `useEffect` fires → `fetch` GET `/notes` with the token → server returns only *this user's* notes → I store them in state → React renders the list with `.map()`.
4. Creating a note → POST `/notes` with the token → the new note comes back → I prepend it to the notes array in state → it appears instantly.

That's the full MERN loop, from a button click in the browser all the way to MongoDB and back.

---

## 🐞 Mistakes & challenges I hit (and how I solved them)

**1. `handleCreate` defined inside `useEffect` (a scope bug).**
I accidentally put my create-note function *inside* the `useEffect` callback, so my form couldn't find it ("Cannot find name 'handleCreate'"). **Lesson:** a function only exists inside the block where it's defined — `handleCreate` had to be a direct function of the component (a sibling of `useEffect`) for the JSX to reach it. Same "right scope / right place" theme as putting `req.body` code in the wrong place on the backend.

**2. CORS blocked my very first API call from the browser.**
The browser refused to let my frontend (`:5173`) call my backend (`:3000`). **Lesson:** browsers block cross-origin requests by default for security; the *server* has to opt in. I added the `cors()` middleware and it worked.

**3. A dependency installed in the wrong folder.**
Earlier, `bcrypt` got installed at the project root instead of inside `server/`, so it wasn't declared where it's actually used. It worked by luck (Node looks in parent folders too), but a fresh clone would have broken. **Lesson:** install dependencies in the folder that actually uses them.

---

## 🔧 How I'd change or extend this

I'd add **React Router** for real pages (separate `/login`, `/signup`, `/notes` URLs) instead of conditional rendering. I'd use **React Query (TanStack Query)** to handle data fetching, caching, and loading/error states instead of manual `useEffect` + `fetch`. I'd add a **signup screen**, **edit/delete** buttons on each note, proper **loading and error UI**, and real **styling**. I'd also centralize the API calls (and the token header) into one helper instead of repeating `fetch` everywhere.

---

## 💬 Questions they might ask — answered in my own words

**"What is React, in one sentence?"** — A library for building UIs out of components, where I describe what the UI should look like for a given state and React keeps the screen in sync when state changes.

**"State vs props?"** — State is data a component owns and can change (`useState`); props are data passed *into* a component from its parent. Props flow down; state is local.

**"Why `useEffect`?"** — To run side effects (like fetching data) at the right time — e.g. once when the component mounts — rather than on every render.

**"How does the app stay logged in?"** — After login I store the JWT in `localStorage` and send it in the `Authorization` header on every request. On refresh I read it back from `localStorage`.

**"What is CORS?"** — A browser security rule that blocks a page from calling an API on a different origin unless that server explicitly allows it. I enabled it with the `cors` middleware.

**"Why not just `push` to the notes array?"** — React only re-renders when state becomes a *new* value, so I create a new array (`[newNote, ...notes]`) instead of mutating the old one.

---

## 🧠 The short version to remember

The frontend is a **React + Vite + TypeScript** app, built from **components** that render based on **state** (`useState`) — change the state, React re-renders. It **fetches** data from my API (sending the JWT in the `Authorization` header), stores the login token in **`localStorage`**, and uses **`useEffect`** to load data when a screen appears. **Conditional rendering** swaps between the login form and the notes screen. Under it all: **click → change state → React re-renders → the screen matches the data.**
