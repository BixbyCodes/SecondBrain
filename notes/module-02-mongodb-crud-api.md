# Module 2 — How My App Stores and Manages Data (MongoDB, Mongoose & the CRUD API)

*Read-through notes for interview prep. This is the "data layer" of my project — how notes get saved, fetched, changed, and deleted.*

---

## The big picture: giving my server a memory

Before this module, my server could talk, but it had **amnesia** — restart it and everything was forgotten, because nothing was being stored anywhere permanent. This module fixed that by connecting the server to a **database**, which is the server's long-term memory. It lives outside my program, so even if the server crashes or restarts, the data survives.

Once that memory exists, the natural next question is: *how does the outside world put things into it and get things back out?* That's what my **API** is for — a set of web addresses (endpoints) the frontend can call to create, read, update, and delete notes.

> **If asked to explain this part simply:** *"Notes are stored in MongoDB, and I built a REST API on top of it so the frontend can create, read, update, and delete notes. Mongoose sits in the middle to enforce the shape of the data."*

---

## Where the data lives: MongoDB and Atlas

**MongoDB** is the specific database I used. It's a type called a **document database** (or "NoSQL"). Instead of storing data in rigid tables of rows and columns like a traditional SQL database, it stores **documents that look almost exactly like the JSON objects I already use in JavaScript** — curly braces with keys and values. That's why it feels so natural in a JavaScript project: the data looks the same whether it's in the database, in my server, or in the browser.

The older, more traditional style is a **SQL database** (like MySQL or PostgreSQL), which stores data in structured tables and is very strict about shape. Both are valid; they're just suited to different things. If an interviewer asks *"why MongoDB and not SQL?"*, my honest answer is: my data is naturally document-shaped, MongoDB fits the JavaScript stack cleanly, and — importantly for this project — the cloud version supports **Vector Search**, which I'll need later for the AI features.

That cloud version is **MongoDB Atlas** — MongoDB hosted and managed for me online, instead of installed on my laptop. So my database runs in the cloud, and my server connects to it over the internet.

---

## Mongoose: the translator between my code and the database

I don't talk to MongoDB directly. I use a library called **Mongoose**, which acts as a translator and a rule-enforcer between my server and the database. It does two main jobs.

First, it **connects** my server to the database. Second, and more importantly, it lets me define a **schema** — the official shape that every note must follow. Without a schema, someone could save a note with no title, or a title that's accidentally a number, and slowly corrupt my data. Mongoose refuses to let that happen.

There are three words here that are easy to mix up, so here's how I keep them straight, using the idea of a factory that makes chairs:

- The **schema** is the *blueprint* — it describes what a note is: which fields it has, their types, and which are required.
- The **model** is the *machine* built from that blueprint. I use the model (called `Note`) to actually create, find, update, and delete notes.
- A **document** is a *single finished chair* — one real note sitting in the database.

So the flow of data goes: my Express server talks to Mongoose, and Mongoose talks to MongoDB.

If asked *"what is Mongoose?"*, the clean answer is: *"It's an ODM — an Object Data Modeling library — that lets me define schemas and gives me an easy API to work with MongoDB, with validation built in."*

---

## Designing the Note: the shape of my data

Deciding what fields a note should have is a real skill called **data modeling**, and it's worth doing thoughtfully before writing code. My Note ended up with four fields I define, plus some the database adds for me.

The ones I define: a **title** (required text), the **content** (required text — this is the actual body of the note, the whole point of it), **tags** (a list of short labels like "react" or "ideas", for organising and finding notes), and **imageUrls** (a list of links to any images).

One small but interesting decision: for images, I **don't store the actual image files in the database** — databases are bad at holding big binary files. Instead I store a **link (a URL)** to where each image lives, and since a note can have several, it's a list of URLs.

On top of those, MongoDB and Mongoose automatically add three more: a unique **`_id`** for every document (this is how I later target one specific note to fetch, update, or delete), and **`createdAt`** and **`updatedAt`** timestamps, which I switched on with a single setting. Whenever I edit a note, `updatedAt` refreshes automatically while `createdAt` stays put.

Here's the model, and I can explain every line of it:

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

`required: true` means the note can't be saved without it. `[String]` means "a list of text values", and `default: []` means "if none are given, start with an empty list."

---

## Talking to the data: the CRUD API

Almost everything an app does to data is one of four actions, and together they spell **CRUD**: **C**reate, **R**ead, **U**pdate, **D**elete. The neat part is that these line up with the standard HTTP methods, which is the core idea behind a **REST API** — the *method* of the request signals the *intent*.

So my Notes API has five endpoints:

- **Create** a note — a `POST` request to `/notes`.
- **Read** all notes — a `GET` request to `/notes`.
- **Read** one specific note — a `GET` request to `/notes/:id` (where `:id` is a placeholder for the note's unique id).
- **Update** a note — a `PATCH` request to `/notes/:id`.
- **Delete** a note — a `DELETE` request to `/notes/:id`.

To walk through one in plain English — **creating a note**: the frontend sends a POST request to `/notes` with the note's data in the request body. My `express.json()` middleware reads that body, the router matches the request to my create handler, and the handler runs `await Note.create(req.body)`. Mongoose checks the data against my schema, and if it's valid, saves it to Atlas. The database hands back the finished note — now including its `_id` and timestamps — and my handler replies with a `201 Created` status and the new note as JSON.

Here's that handler:

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

## The concepts I can genuinely explain (the interview gold)

A few ideas came up again and again while building this, and being able to explain them is what separates "I followed a tutorial" from "I understand this."

**Async and await.** Talking to a database takes time, because it happens over a network. So database calls are **asynchronous** — they don't hand back the answer instantly; they hand back a **Promise**, which is basically an IOU that says "I'll have your data in a moment." The keyword `await` means "pause here until that IOU is fulfilled, then give me the real data." Any function that uses `await` has to be marked `async`. If I forget the `await`, my variable ends up holding the IOU instead of the actual data — a subtle but common bug.

**"Not found" is not an error.** This one's subtle and interviewers like it. When I look up a note by id and nothing matches, Mongoose doesn't throw an error — it calmly returns **`null`**. That means my `try/catch` block won't catch it, because `catch` only runs when something actually *throws*. So I check for `null` myself and respond with a **404 Not Found**. I keep the `catch` block for genuine server errors, which get a **500**. The takeaway I'd say out loud: *"A `null` result is an expected value I check for, whereas the catch block is for unexpected crashes — so 'not found' is a 404 and a real error is a 500."*

**Two gotchas when updating.** When I update a note, I pass two options that aren't obvious. `new: true` tells Mongoose to return the *updated* version of the note (by default it returns the old one, which is almost never what you want). And `runValidators: true` tells it to *re-check my schema rules on the update* — because, surprisingly, Mongoose skips validation on updates by default, which would let someone sneak an empty title through.

**Where the data on a request comes from.** Three different places, and knowing the difference matters: `req.body` is the JSON payload sent with the request (for creating and updating), `req.params` is a value baked into the URL path (like the id in `/notes/:id`), and `req.query` is the `?key=value` part of the URL (used for things like search and filtering).

**PUT versus PATCH.** Both update, but `PUT` means "replace the whole thing" while `PATCH` means "change just these fields." I used PATCH because editing a note is usually a partial change — just the title, or just the content.

**Status codes speak to the client.** I try to send the honest one: `200` for a successful read or update, `201` when something new is created, `400` when the client sent bad data, `404` when they asked for something that doesn't exist, and `500` when my server itself hit a problem.

---

## Keeping the code tidy: the router refactor

At first, all five routes lived in my main `index.ts` file alongside the database setup and everything else. That works, but it doesn't *scale* — as I add authentication, users, and AI features, that one file would balloon into an unreadable mess.

So I applied a principle called **separation of concerns**: every file should have one clear job. I moved all the note routes into their own file using an **Express Router**, which is like a mini-app that groups related routes together. Inside that file the paths become relative — just `/` and `/:id` — and then I "plug in" the whole group in one line in `index.ts` with `app.use("/notes", noteRoutes)`. That line re-attaches the `/notes` prefix to every route in the group. Now `index.ts` is short and obvious: set up middleware, plug in the routers, connect the database, start the server. Each resource gets its own tidy file.

---

## Keeping secrets safe (and shipping to GitHub)

My database connection string contains a password, so it's a **secret**. I keep it in a special file called **`.env`**, which my code reads through a tool called `dotenv`. Crucially, `.env` is listed in a **`.gitignore`** file, which tells Git to never upload it. I also keep a committed `.env.example` file that lists *which* variables are needed but with fake values, so anyone setting up the project knows what to fill in without ever seeing my real secrets.

When I saved the project to **GitHub**, I used the everyday Git cycle: `git add` to stage my changes, `git status` to double-check what's about to be saved, `git commit` to take a permanent snapshot with a message, and `git push` to upload it. That `git status` check before pushing is a habit worth having — it's how I caught a real mistake (more on that below).

---

## If I had to change or extend this

Some natural next steps, which double as good interview answers. I'd add **pagination** so `GET /notes` returns notes in pages instead of all at once (using the query string, `?page=2&limit=20`). I'd add **search and filtering** by tag, again through the query string. I'd validate incoming data more strictly with a library like **Zod** before it reaches the database. I'd add **authentication and ownership**, so each note belongs to a user and people only see their own (that's literally my next module). And I'd move the handler logic into separate **controller** files to keep the route files thin.

---

## Questions they might ask — and how I'd answer

**"Why did you choose MongoDB over a SQL database?"**
My data is naturally document-shaped, MongoDB pairs really cleanly with a JavaScript stack, and the cloud version supports vector search which I need for the AI features. For highly relational data with lots of transactions, I'd consider SQL instead.

**"What is Mongoose and why use it?"**
It's an ODM that sits between my code and MongoDB. It lets me define a schema for my data, validates data against that schema, and gives me a clean API to query the database.

**"How do you handle errors in your API?"**
Each handler wraps its database call in a try/catch. Expected "missing" cases I handle explicitly with a null-check and a 404, and genuine failures fall to the catch block as a 500. I always try to send an honest status code.

**"What's the difference between PUT and PATCH?"**
PUT replaces the entire resource; PATCH updates only the fields you send. I used PATCH for editing notes.

**"How do you keep your database password out of your code?"**
It lives in a git-ignored `.env` file and is read through environment variables, with a safe `.env.example` template committed in its place.

**"How would you make sure a user only sees their own notes?"**
I'd add authentication, store an `owner` reference on each note, and filter every query by the logged-in user's id — which is exactly what I'm building next.

---

## Debugging war stories (worth telling out loud)

**The four-layer database connection saga.** Connecting to Atlas failed four times, each with a *different* error, and I fixed them one at a time. First, the connection string came out `undefined` because I hadn't actually created the `.env` file. Then it failed because the variable name in my `.env` didn't exactly match the name in my code — a good reminder that computers don't do "close enough." Then it failed because my computer's IP address wasn't on Atlas's allow-list. And finally it failed with a "bad auth" error because I'd left placeholder angle-brackets around the password. The real lesson, and the thing I'd actually say in an interview, is that **a changing error message means you're making progress** — you read each one carefully and peel the problem one layer at a time.

**The double prefix.** After moving my routes into a router mounted at `/notes`, I accidentally left `/notes` on the individual routes too, so they became `/notes/notes`. It taught me that the mount point already adds the prefix, so the routes inside a router should be written relative.

**Catching a secret leak before it happened.** My `.gitignore` had accidentally ended up containing my actual connection string instead of ignore-rules — which meant my `.env` would have been uploaded to GitHub. I caught it by checking `git status` before pushing. That's exactly why the habit of looking before you push matters.

---

## The short version to remember

My notes are stored in MongoDB (cloud-hosted on Atlas), and I use Mongoose to define the shape of a note and to talk to the database safely. On top of that sits a REST API with full CRUD — create, read, update, delete — with proper error handling and honest status codes. The routes are organised with an Express Router for tidiness, and my database secret is kept out of Git in a `.env` file. Underneath every endpoint is the same loop from Module 1: **a request comes in, my server reads or changes the data, and a response goes out.**
