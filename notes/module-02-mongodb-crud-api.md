# 🗄️ Module 2 — The Data Layer
### MongoDB · Mongoose · the CRUD API

> **What this covers:** how notes actually get **saved, fetched, changed, and deleted** — the database, the shape of the data, the API the frontend talks to, and the messy real-world debugging that made it all work. Written to *understand*, not memorise.

---

## 🧩 The data layer at a glance

| Piece | In one line | Why it's here |
|-------|-------------|---------------|
| **MongoDB** | A NoSQL database that stores JSON-like documents | Data looks like JS objects — natural fit for the stack |
| **Atlas** | MongoDB hosted in the cloud | No local install, and it supports Vector Search (for AI later) |
| **Mongoose** | A translator + rule-enforcer between my code and MongoDB | Defines the shape of data and validates it |
| **CRUD API** | Create, Read, Update, Delete over HTTP | The standard way the frontend manages notes |

> 🎯 **The one-liner to say in an interview:**
> *"Notes are stored in MongoDB (cloud-hosted on Atlas), and I use Mongoose to define their shape and talk to the database safely. On top sits a REST API with full CRUD, proper error handling, and honest status codes."*

---

## 🧠 The big picture: giving my server a memory

Before this module, my server could talk, but it had **amnesia** — restart it and everything was forgotten, because nothing was stored anywhere permanent. This module fixed that by connecting the server to a **database**, the server's long-term memory. It lives *outside* my program, so even if the server crashes or restarts, the data survives.

Once that memory exists, the next question is: *how does the outside world put things into it and get them back out?* That's what my **API** does — a set of web addresses the frontend can call to create, read, update, and delete notes.

---

## 🍃 Where the data lives: MongoDB & Atlas

**MongoDB** is a **document database** (the "NoSQL" family). Instead of rigid tables of rows and columns like a traditional SQL database, it stores **documents that look almost exactly like the JSON objects I already use in JavaScript** — curly braces with keys and values. That's why it feels so natural here: the data looks the same in the database, in my server, and in the browser.

The traditional alternative is a **SQL database** (MySQL, PostgreSQL), which uses structured tables and is strict about shape. Both are valid — just suited to different things.

> 💡 **If asked "why MongoDB over SQL?":** *"My data is naturally document-shaped, it pairs cleanly with a JavaScript stack, and the cloud version supports vector search which I'll need for AI. For highly relational data with heavy transactions, I'd lean toward SQL."*

**MongoDB Atlas** is just MongoDB hosted and managed in the cloud instead of on my laptop. So my database runs online, and my server connects to it over the internet.

---

## 🔌 Mongoose: the translator between my code and the database

I don't talk to MongoDB directly — I use **Mongoose**, which acts as a translator and rule-enforcer. It does two jobs: it **connects** my server to the database, and it lets me define a **schema** — the official shape every note must follow. Without a schema, someone could save a note with no title, or a title that's secretly a number, and slowly corrupt my data. Mongoose refuses.

Three words that are easy to confuse, explained with a chair factory:

- **Schema** → the *blueprint*. Describes what a note is: its fields, their types, which are required.
- **Model** → the *machine* built from the blueprint. I use the model (`Note`) to create, find, update, and delete notes.
- **Document** → a *single finished chair*. One real note in the database.

So data flows: **my Express server → Mongoose → MongoDB.**

> 💡 **If asked "what is Mongoose?":** *"It's an ODM — Object Data Modeling library — that lets me define schemas and gives me a clean API to work with MongoDB, with validation built in."*

---

## 📐 Designing the Note: the shape of my data

Deciding what fields a note needs is a real skill called **data modeling**. Mine ended up with four fields I define, plus three the database adds automatically.

**The fields I define:**
- **title** — required text.
- **content** — required text; the actual body of the note (the whole point of it).
- **tags** — a list of short labels like `"react"` or `"ideas"`, for organising and finding notes.
- **imageUrls** — a list of *links* to images.

> 📌 A deliberate decision: I **don't store image files in the database** — databases are bad at big binary files. I store a **URL** pointing to where each image lives, and since a note can have several, it's a list of URLs.

**The three the database adds for free:** a unique **`_id`** for every document (how I later target one specific note), plus **`createdAt`** and **`updatedAt`** timestamps (switched on with one setting). Editing a note refreshes `updatedAt` automatically while `createdAt` stays put.

```ts
const noteSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true },
    content:   { type: String, required: true },
    tags:      { type: [String], default: [] },
    imageUrls: { type: [String], default: [] },
  },
  { timestamps: true }   // auto-adds createdAt & updatedAt
);
```

`required: true` = can't save without it. `[String]` = a list of text. `default: []` = start empty if none given.

---

## 🌐 Talking to the data: the CRUD API

Almost everything an app does to data is one of four actions — **C**reate, **R**ead, **U**pdate, **D**elete (**CRUD**). Neatly, these line up with HTTP methods, which is the core idea of a **REST API**: the *method* signals the *intent*.

| Action | Method + Route | What it does |
|--------|----------------|--------------|
| Create | `POST /notes` | Make a new note |
| Read all | `GET /notes` | List every note |
| Read one | `GET /notes/:id` | Fetch one note by its id |
| Update | `PATCH /notes/:id` | Change some fields of a note |
| Delete | `DELETE /notes/:id` | Remove a note |

**Walking through a "create" in plain English:** the frontend sends a POST to `/notes` with the note's data in the request body. My `express.json()` middleware reads that body, the router matches my create handler, and it runs `await Note.create(req.body)`. Mongoose checks the data against my schema, and if valid, saves it to Atlas. The database hands back the finished note — now with its `_id` and timestamps — and my handler replies `201 Created` with the note as JSON.

```ts
router.post("/", async (req, res) => {
  try {
    const newNote = await Note.create(req.body);
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).json({ message: "Failed to create note", error });
  }
});
```

---

## ⭐ Concepts I can genuinely explain (the interview gold)

**Async & await.** Talking to a database takes time (it's over a network), so DB calls are **asynchronous** — they don't return the answer instantly, they return a **Promise**, basically an IOU ("I'll have your data in a moment"). `await` means "pause until that IOU is fulfilled, then give me the real data." Any function using `await` must be `async`. Forget the `await`, and my variable holds the IOU instead of the data.

**"Not found" is not an error.** *(Interviewers love this one.)* When I look up a note by id and nothing matches, Mongoose doesn't throw — it calmly returns **`null`**. So my `try/catch` won't catch it, because `catch` only runs when something actually *throws*. I check for `null` myself and return a **404**. The `catch` block is for genuine crashes, which get a **500**.
> 💡 In my words: *"A `null` result is an expected value I check for; the catch block is for unexpected crashes. So 'not found' is a 404, and a real error is a 500."*

**Two gotchas when updating.** When I update, I pass two non-obvious options: `new: true` returns the *updated* note (by default Mongoose returns the *old* one), and `runValidators: true` re-checks my schema rules on the update (surprisingly, Mongoose skips validation on updates by default).

**Where request data comes from.** Three places, and the difference matters: `req.body` (the JSON payload, for create/update), `req.params` (a value in the URL path, like the id in `/notes/:id`), and `req.query` (the `?key=value` part, for search/filter).

**PUT vs PATCH.** `PUT` replaces the whole resource; `PATCH` changes only the fields you send. I used PATCH because editing a note is usually partial.

**Status codes speak to the client.** I send the honest one: `200` OK, `201` Created, `400` Bad Request (client sent bad data), `404` Not Found, `500` Internal Server Error.

---

## 🧹 Keeping the code tidy: the router refactor

At first all five routes lived in my main `index.ts` alongside the database setup. That works but doesn't *scale* — as I add auth, users, and AI, that one file would become an unreadable mess.

So I applied **separation of concerns** (every file has one job): I moved the note routes into their own file using an **Express Router** (a mini-app that groups related routes). Inside, the paths become relative — just `/` and `/:id` — and I plug the whole group in with one line: `app.use("/notes", noteRoutes)`, which re-attaches the `/notes` prefix. Now `index.ts` is short and obvious: set up middleware → plug in routers → connect the database → start the server.

---

## 🔐 Keeping secrets safe (and shipping to GitHub)

My database connection string contains a password, so it's a **secret**. It lives in a **`.env`** file read via `dotenv`, and `.env` is listed in **`.gitignore`** so Git never uploads it. I also commit a `.env.example` that lists *which* variables are needed with fake values, so anyone setting up the project knows what to fill in without seeing my real secrets.

Saving to **GitHub** uses the everyday Git cycle: `git add` (stage) → `git status` (double-check) → `git commit` (snapshot) → `git push` (upload). That `git status` check before pushing is a habit worth having — it's how I caught a real mistake (below).

---

## 🐞 Mistakes & challenges I hit (and how I solved them)

*The real story — this is what shows I built it for real.*

**1. The four-layer database connection saga.**
Connecting to Atlas failed *four times*, each with a **different** error, and I fixed them one at a time:
- First, the connection string was `undefined` — I hadn't actually created the `.env` file.
- Then the variable name in my `.env` didn't exactly match the name in my code — computers don't do "close enough."
- Then my computer's IP wasn't on Atlas's allow-list (a security firewall that blocks everything until you let your address in).
- Finally a "bad auth" error, because I'd left the placeholder `<>` brackets around the password.
> 🧠 **The real lesson (great to say out loud):** *a changing error message means you're making progress.* You read each one carefully and peel the problem one layer at a time.

**2. The double route prefix after the refactor.**
After moving routes into a router mounted at `/notes`, I left `/notes` on the individual routes too, so they became `/notes/notes` — and `GET /notes` returned "Cannot GET /notes."
> 🧠 **Lesson:** the mount point already adds the prefix, so routes inside a router are written *relative* (`/`, `/:id`).

**3. I caught a secret leak *before* it happened.**
My `.gitignore` had accidentally ended up containing my real connection string instead of ignore-rules — meaning my `.env` would have been uploaded to GitHub. I caught it by running `git status` before the first push and seeing what was staged.
> 🧠 **Lesson:** always look at what's staged before you push. A `.gitignore` only protects you if it's actually correct.

---

## 🔧 How I'd change or extend this

Add **pagination** so `GET /notes` returns pages instead of everything (`?page=2&limit=20`). Add **search/filter** by tag through the query string. Validate incoming data more strictly with a library like **Zod**. Add **authentication + ownership** so each note belongs to a user and people only see their own (my next module). And move handler logic into separate **controller** files to keep routes thin.

---

## 💬 Questions they might ask — answered in my own words

**"Why MongoDB over SQL?"** — Document-shaped data, clean fit with JavaScript, and Atlas vector search for AI. For heavily relational, transaction-heavy data I'd consider SQL.

**"What is Mongoose / an ODM?"** — A layer between my code and MongoDB that lets me define a schema, validates data against it, and gives me an easy query API.

**"How do you handle errors in your API?"** — try/catch per handler; expected "missing" cases get an explicit null-check and a 404; genuine failures fall to the catch as a 500; always an honest status code.

**"PUT vs PATCH?"** — PUT replaces the whole resource; PATCH updates only the fields you send. I used PATCH for editing notes.

**"How do you keep your DB password out of your code?"** — It's in a git-ignored `.env`, read via environment variables, with a safe `.env.example` template committed instead.

**"How would you make a user only see their own notes?"** — Add authentication, store an `owner` reference on each note, and filter every query by the logged-in user's id — exactly what I'm building next.

---

## 🧠 The short version to remember

Notes live in **MongoDB** (cloud-hosted on **Atlas**); **Mongoose** defines their shape and talks to the database safely. On top sits a **REST API with full CRUD**, proper error handling, and honest status codes. Routes are organised with an **Express Router**, and my DB secret is kept out of Git in a `.env`. Under every endpoint is the same loop from Module 1: **a request comes in, my server reads or changes the data, and a response goes out.**
