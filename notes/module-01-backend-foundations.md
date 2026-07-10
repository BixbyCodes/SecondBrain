# 📦 Module 1 — Backend Foundations
### Node.js · Express · TypeScript

> **What this covers:** how the *server* half of my app is built — the language it runs on, the framework that routes requests, why it's written in TypeScript, and the one idea (**request → response**) that everything else sits on top of. Written to actually *understand*, not to memorise.

---

## 🧩 The stack at a glance

| Piece | In one line | Why it's here |
|-------|-------------|---------------|
| **Node.js** | Runs JavaScript on the server | One language across the whole app |
| **Express** | Routes each request to a function | Clean, minimal, industry-standard |
| **TypeScript** | JavaScript **+ type safety** | Catches bugs *before* the code runs |
| **tsx** | Runs TypeScript instantly in dev | Fast auto-reload, no compile step |

> 🎯 **The one-liner to say in an interview:**
> *"My backend is a REST API built with Node and Express, written in TypeScript. It listens for HTTP requests from the frontend, processes them, talks to a MongoDB database, and responds with JSON."*

---

## 🌍 The big picture: what a "backend" even is

My project has two halves. The **frontend** is what the user sees and clicks. The **backend** is the brain behind it — a program running on a server that receives requests, does the thinking, talks to the database, and sends answers back.

The simplest way to picture it: **the web is just two computers passing notes.** The user's browser sends a request — *"give me my notes"* — my server receives it, works out the answer (usually by asking the database), and sends a response back. That back-and-forth — a **request**, then a **response** — is the foundation under everything I built. Every feature is just a richer version of that one conversation.

The full journey for a real feature looks like this:

```
Browser  ──request──▶  My Server  ──asks──▶  Database
   ▲                       │                     │
   └────response───────────┴──────gives back─────┘
```

---

## 🟢 Node — why JavaScript can run on a server at all

Normally JavaScript only runs inside a web browser. **Node.js** changed that — it lets JavaScript run as a normal program on a computer, *outside* any browser. That's the whole reason I could write my server in JavaScript (well, TypeScript) instead of a different language like Python or Java.

Why it matters: my entire project — front and back — is written in **one language**. Less switching between mindsets, and I can share ideas across both halves.

> 💡 **If asked "what is Node?":** *"A runtime that lets JavaScript run on the server."*

There's a deeper point interviewers sometimes push on: Node is **single-threaded** and uses an **event loop**. In plain English, that means Node doesn't freeze while waiting for the database — it goes and handles other requests in the meantime, then comes back when the data's ready. That's why it suits web apps, which spend most of their time *waiting* on databases and networks rather than doing heavy maths.

---

## 🚂 Express — the receptionist that routes requests

Node on its own *can* handle web requests, but it's clumsy and low-level. **Express** is a small, popular framework on top of Node that makes the everyday jobs easy — mainly **routing**.

Routing just means: *"when a request comes in for this address, run this function."* When a request arrives for `/notes`, run the function that fetches all notes.

> 🏢 **Mental image:** Express is a **receptionist**. A request walks in, the receptionist looks at where it's headed — the method (GET, POST…) and the path (`/notes`) — and sends it to the right desk (my handler function).

---

## 🛡️ TypeScript — guard rails that catch my mistakes early

Plain JavaScript is very forgiving, which is actually a problem: it lets you make silly mistakes (a typo, treating a number like text) that only blow up later, at runtime, often in front of a user. **TypeScript** is JavaScript with **types** added — labels that say *"this value is text"* or *"this is a number."*

Because of those labels, my editor warns me about mistakes **while I'm still typing**, not after the app is running. It's like guard rails on a mountain road. TypeScript doesn't run directly — it compiles down to ordinary JavaScript — and in development I run it with **`tsx`**, which runs the TypeScript directly and restarts the server every time I save.

> 💡 **Interview reason for TypeScript:** *"It catches a whole class of bugs before the code runs, gives better autocomplete, and documents what my data looks like — which matters more and more as a project grows."*

---

## 🔁 The idea everything hangs on: request → handler → response

This is the heart of backend work, and it took me a moment to truly *get* it.

When I write `app.get("/notes", handler)`, I'm **not** running code right then. I'm leaving an instruction for later. I'm telling Express: *"Remember this — whenever a GET request arrives at `/notes` in the future, run this handler."* The handler then **waits**, and runs **once per request**, maybe seconds or hours later.

That's the moment Express hands my handler two things:
- **`req`** (request) — everything about the incoming request: its data, its URL details, its headers.
- **`res`** (response) — my toolkit for replying, e.g. `res.json(...)` to send JSON back.

A tiny but complete route, every word of which I can explain:

```ts
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
```

In English: *"When a GET request hits `/health`, reply with the JSON `{ status: "ok" }`."* I use `res.json()` (not `res.send()`) for data, because it converts my object to JSON **and** labels the response as JSON so the frontend knows how to read it.

---

## 🧱 Middleware — the checkpoint every request passes through

**Middleware** is a function that runs on a request **before** it reaches my handler — like a checkpoint everyone passes on the way in. It can inspect or change the request, or stop it.

The one I rely on is **`express.json()`**. When the frontend sends data (like a new note), it arrives as raw text. `express.json()` reads it and turns it into a usable object on `req.body`.

> 💡 **If asked "what is middleware?":** *"A function that runs between the request arriving and my handler running — for example, `express.json()` parses the JSON body so my handler can use it."*

---

## 🐞 Mistakes & challenges I hit (and how I solved them)

*This is the part that proves I actually built it — real problems, not tutorial copy-paste.*

**1. My `/health` route wouldn't even start — a JSON syntax error.**
I first wrote `res.send("status" : "ok")`. It refused to run.
- **Why:** the `"key" : "value"` pattern only exists *inside an object*, wrapped in curly braces `{ }` — I'd forgotten the braces. And `res.send` isn't the right tool for sending structured data anyway.
- **Fix:** `res.json({ status: "ok" })`.
- **Lesson:** objects need `{ }`, and `res.json()` is what you use to send JSON data.

**2. `req.body` came back as `undefined` when I sent data.**
My POST requests arrived, but the data inside them was missing.
- **Why:** Express doesn't read JSON request bodies by default — you have to switch on the parser.
- **Fix:** add `app.use(express.json())` near the top of the app.
- **Lesson:** middleware runs *before* handlers and shapes what the handler receives. Forgetting `express.json()` is one of the most common Express bugs, and now I understand exactly why it happens.

---

## 🔧 How I'd change or extend this

To add a feature, I register a new route. To make the server configurable, I read settings from environment variables instead of hard-coding them. To let a browser frontend on a different address call the API, I'd add **CORS**. For production I'd add request logging, security headers, and rate limiting. The theme: Express is built from small, composable pieces — routes and middleware — so extending it is mostly adding more of those pieces.

---

## 💬 Questions they might ask — answered in my own words

**"What's the difference between the client and the server?"**
The client is the program making the request — the browser or React app. The server receives it, runs the logic, talks to the database, and sends a response. I built both sides.

**"What are `req` and `res`?"**
The two objects Express gives my handler. `req` is the incoming request (body, URL params, headers); `res` is how I reply (`res.json`, `res.status`, and so on).

**"Why TypeScript instead of plain JavaScript?"**
It catches type bugs while I'm coding rather than at runtime, makes the editor smarter, and documents my data. That safety compounds as the project grows.

**"Is Node multi-threaded?"**
The JavaScript runs on a single thread with an event loop, and input/output is non-blocking — so while it waits on the database it can serve other requests. Great for web apps, which are mostly waiting.

---

## 🧠 The short version to remember

My backend is a **Node + Express** server written in **TypeScript**. It listens for HTTP requests, routes each one to a handler, uses middleware like `express.json()` to prepare the request, and replies with JSON. Under all of it is one idea I can always fall back on: **a request comes in, my server thinks, a response goes out.**
