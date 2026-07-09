# Module 1 — How My Backend Works (Node, Express & TypeScript)

*Read-through notes for interview prep. If I understand this page, I can talk about my backend confidently. No memorising — just understanding.*

---

## The big picture: what the backend actually is

My project has two halves. The **frontend** is what the user sees and clicks. The **backend** is the brain behind it — a program running on a server that receives requests, does the thinking, talks to the database, and sends answers back.

The simplest way to picture the whole thing is this: **the web is just two computers passing notes.** The user's browser sends a request — something like *"give me my notes"* — and my server receives it, works out the answer (usually by asking the database), and sends a response back. That back-and-forth — a **request**, then a **response** — is the foundation underneath everything I built. Every single feature is just a fancier version of that one conversation.

> **If an interviewer says "explain your backend simply," I'd say:**
> *"It's a server built with Node and Express, written in TypeScript. It listens for requests from the frontend, processes them, talks to a MongoDB database, and sends back JSON."*

---

## Node — why JavaScript can run on a server at all

Normally, JavaScript only runs inside a web browser. **Node.js** is the thing that changed that — it lets JavaScript run as a normal program on a computer, outside any browser. That's the entire reason I could write my server in JavaScript (well, TypeScript) instead of a completely different language like Python or Java.

Why does that matter in practice? Because it means my whole project — front and back — is written in **one language**. I'm not switching brains between the two halves, and I can share ideas and even code between them.

So if someone asks *"what is Node?"*, the honest one-liner is: **it's a runtime that lets JavaScript run on the server.**

There's a slightly deeper point interviewers sometimes push on: Node is **single-threaded** and uses something called an **event loop**. In plain English, that means Node doesn't just sit there frozen when it asks the database for something — it goes off and handles other requests while it waits, then comes back when the data is ready. That's why Node is a good fit for web apps, which spend most of their time *waiting* on databases and networks rather than doing heavy maths.

---

## Express — the tool that sends each request to the right place

Node on its own *can* handle web requests, but doing it directly is clumsy and low-level. **Express** is a small, popular framework that sits on top of Node and makes the everyday jobs easy — most importantly, **routing**.

Routing just means: *"when a request comes in for this address, run this particular function."* For example, when a request arrives asking for `/notes`, run the function that fetches all the notes. Express lets me write that in one clean line.

The mental image I use: **Express is a receptionist.** A request walks through the door, the receptionist glances at where it's headed — the method (GET, POST…) and the path (`/notes`) — and sends it to the correct desk, which is my handler function for that route.

---

## TypeScript — guard rails that catch my mistakes early

Plain JavaScript is very forgiving, and that's actually a problem: it happily lets you make silly mistakes (a typo in a property name, treating a number like text) that don't blow up until the code is already running — often in front of a user. **TypeScript** is JavaScript with **types** added on top. A "type" is just a label saying *"this value is text"* or *"this is a number."*

Because of those labels, my editor can warn me about mistakes **while I'm still typing**, instead of at runtime. It's like having guard rails on a mountain road. TypeScript doesn't run directly — it gets compiled down into ordinary JavaScript — but during development it makes me far less likely to ship a dumb bug. In my project I run it with a tool called **`tsx`**, which runs the TypeScript directly and automatically restarts the server every time I save.

> **Interview-friendly reason for TypeScript:** *"It catches a whole class of bugs before the code ever runs, gives me better autocomplete, and documents what my data looks like — which matters a lot as a project grows."*

---

## The one idea everything hangs on: request → handler → response

Here's the concept that took me a moment to really *get*, and it's the heart of backend work.

When I write a line like `app.get("/notes", handler)`, I am **not** running any code right then. I'm leaving an instruction for later. I'm telling Express: *"Remember this — whenever a GET request arrives at `/notes` in the future, run this handler function for me."* The handler then sits and waits. It runs **once per request**, maybe seconds or hours later.

And *that* is the moment Express hands my handler two things: **`req`** and **`res`**.
- **`req`** (request) is everything about the incoming request — the data sent in its body, values in the URL, and so on.
- **`res`** (response) is my toolkit for replying — for example `res.json(...)` to send back JSON data.

So a tiny but complete route looks like this, and I can explain every word of it:

```ts
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
```

In English: *"When a GET request hits `/health`, reply with the JSON object `{ status: "ok" }`."* I use `res.json()` (rather than `res.send()`) whenever I'm sending data, because it converts my object to JSON **and** labels the response as JSON so the frontend knows how to read it.

---

## Middleware — the checkpoint every request passes through

One more concept that comes up constantly. **Middleware** is a function that runs on a request **before** it reaches my handler — like a checkpoint everyone passes through on the way in. It can inspect or change the request, or stop it entirely.

The one I rely on is `express.json()`. When the frontend sends data (say, a new note), that data arrives as raw text in the request body. `express.json()` reads it and turns it into a usable object on `req.body`. **If I forget to switch it on, `req.body` comes out empty** — which is a classic beginner bug I actually hit and now understand.

> **If asked "what is middleware?":** *"A function that runs between the request coming in and my handler running. It can read or modify the request — for example, `express.json()` parses the JSON body so my handler can use it."*

---

## If I had to change or extend this

This is the kind of follow-up interviewers love, so it's worth having answers ready. To add a new feature, I'd register a new route. To make the server configurable, I read settings from environment variables instead of hard-coding them. To let the browser frontend call the API from a different address, I'd add **CORS**. For production I'd add request logging, security headers, and rate limiting. The point I'd make is that Express is built around small, composable pieces — routes and middleware — so extending it is mostly a matter of adding more of those pieces.

---

## Questions they might ask — and how I'd answer, in my own words

**"What's the difference between the client and the server?"**
The client is the program making the request — the browser or the React app. The server is the program that receives the request, does the logic, talks to the database, and sends a response. In my project I built both sides.

**"What are `req` and `res`?"**
They're the two objects Express gives my handler. `req` is the incoming request — its body, its URL details, its headers. `res` is how I send a reply back, like `res.json()` or `res.status()`.

**"Why did you use TypeScript instead of plain JavaScript?"**
Because it catches type-related bugs while I'm coding instead of at runtime, it makes the editor much smarter, and it acts as living documentation of what my data looks like. That safety pays off more and more as the codebase grows.

**"Is Node multi-threaded?"**
The JavaScript itself runs on a single thread with an event loop, and it handles input/output without blocking. So while it's waiting on the database, it can serve other requests. That's why it suits web apps, which are mostly waiting rather than crunching numbers.

---

## The short version to remember

My backend is a Node + Express server written in TypeScript. It listens for HTTP requests, routes each one to a handler, uses middleware like `express.json()` to prepare the request, and replies with JSON. Underneath it all is a single idea I can always fall back on: **a request comes in, my server thinks, a response goes out.**
