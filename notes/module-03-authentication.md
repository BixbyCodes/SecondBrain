# 🔐 Module 3 — Authentication & Authorization
### Passwords (bcrypt) · Tokens (JWT) · Protected routes · Ownership

> **What this covers:** how my app knows *who* a user is (login) and controls *what* they're allowed to touch (their own notes only). This is the module that turns a public toy into a real, private app. Written to *understand*, not memorise.

---

## 🧩 The auth toolkit at a glance

| Piece | In one line | Why it's here |
|-------|-------------|---------------|
| **bcrypt** | One-way password hashing | So a database leak never exposes real passwords |
| **JWT** | A signed token the client carries | Proves "I'm logged in" without re-sending the password |
| **Auth middleware** | A checkpoint before protected routes | Verifies the token and identifies the user |
| **`owner` field** | Each note references its user | So people only see and edit their own notes |

> 🎯 **The one-liner to say in an interview:**
> *"Users register and log in; passwords are hashed with bcrypt, never stored in plain text. On login I issue a JWT signed with a server secret. A middleware verifies that token on protected routes and attaches the user's id to the request, and every note is scoped to its owner so users only access their own data."*

---

## 🧠 The big picture: from open to secure

Before this module, my API was wide open — anyone could read, edit, or delete anyone's notes. This module added the two things that make an app real:

1. **Authentication** — proving *who you are* (register + login).
2. **Authorization** — controlling *what you're allowed to do* (only your own notes).

> 🪪 **AuthN vs AuthZ** *(interviewers love this distinction):* **Authentication = identity** ("who are you?"). **Authorization = permission** ("what are you allowed to access?"). You authenticate first, then authorize.

---

## 🔒 Storing passwords safely with bcrypt

The golden rule of auth: **never store a real password.** If the database ever leaks and passwords are plain text, every user is exposed — and since people reuse passwords, you've handed over their other accounts too.

The fix is **hashing**. A hash is a **one-way scramble**: `"mypassword123"` becomes something like `"$2b$10$N9qo8uL..."`, and there is **no way to reverse it**. So how does login work if we can't un-scramble? On login we **hash the password the user typed and compare the two hashes** — we never decrypt anything.

Two things bcrypt adds on top:
- **Salt** — a random value mixed in before hashing, so two users with the same password get *different* hashes. This defeats "rainbow table" attacks (precomputed lists of common hashes).
- **Deliberate slowness** — bcrypt is intentionally slow, which makes brute-forcing millions of guesses impractical.

> 💡 **Hashing vs encryption (common question):** encryption is *two-way* (you can decrypt it with a key); hashing is *one-way* (you can't get the original back). Passwords should be **hashed**, not encrypted.

**The elegant part — the password hashes itself.** Instead of remembering to hash everywhere, I attached a Mongoose **hook** to the User schema that runs automatically right before every save:

```ts
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;          // only hash if the password changed
  this.password = await bcrypt.hash(this.password, 10);
});
```
Three things worth knowing here: it's a **regular `function`** (not an arrow) so that `this` refers to the user document; the **`isModified` guard** stops it re-hashing an already-hashed password when you update something else (like the name); and the `10` is the "salt rounds" (the cost factor).

---

## 🎟️ JWT: the wristband

Once a user proves their password, I don't want them re-typing it on every request. So I hand them a **JWT (JSON Web Token)** — think of it as a **wristband at a club**: the bouncer checked your ID once at the door; now you just flash the band.

A JWT is a string in three dot-separated parts (`header.payload.signature`). Three things to understand:
- **The payload** holds data like the user's id. ⚠️ It's only *encoded*, not encrypted — **anyone can read it** (paste one into jwt.io and you'll see). So you never put secrets in it.
- **The signature** is created with a **secret key only the server knows** (`JWT_SECRET`). This is the magic: the server can later check the signature to confirm the token is genuine and untampered. Nobody can forge a valid token without the secret.
- **It's stateless** — the server stores no sessions; the token itself carries the proof. That's why JWTs scale well.

Creating one at login:
```ts
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
```

---

## 🚪 The full flow: register → login → protected routes

**Register** (`POST /auth/register`): take email + password, reject duplicates (a `409 Conflict` if the email's taken), create the user (the hook hashes the password), and respond **without ever sending the password back** — not even the hash.

**Login** (`POST /auth/login`): find the user by email, then `await bcrypt.compare(password, user.password)` to check the password against the stored hash. If it matches, sign a JWT and return it. If not, `401`.

> 🔒 **A subtle security detail:** for *both* "no such email" and "wrong password" I return the **exact same message** — `"Invalid credentials"`. If the messages differed, an attacker could tell which emails are registered. Same message = no information leaked.

---

## 🛂 The checkpoint: auth middleware

Handing out wristbands is only half of it — I need a **bouncer** that checks them. That's a **middleware**: a function that runs *before* a protected route and either waves the request through or blocks it.

The client sends the token in a header: **`Authorization: Bearer <token>`**. The middleware reads it, verifies the signature, and remembers who the user is:

```ts
export function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
    const token = authHeader.split(" ")[1];                    // "Bearer xxx" → "xxx"
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if fake/expired
    req.userId = decoded.userId;                               // remember who this is
    next();                                                    // ✅ let it continue
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
}
```
The shape of a middleware to remember: it takes **`(req, res, next)`** — `next()` is the "let it through" button; sending a response instead blocks the request. I applied it to my notes routes with `app.use("/notes", protect, noteRoutes)`, so the whole notes API now requires a valid token.

---

## 👤 Ownership: only your own notes (authZ in action)

Being logged in isn't enough — user A still shouldn't see user B's notes. So each note stores an **`owner`**, which is a **reference** to the user who made it (I store the user's `_id` on the note, with `ref: "User"`). That's how you model a relationship in MongoDB: store the id of the thing you're pointing to.

Then the magic connects: my middleware already put the logged-in user's id on `req.userId`, so every note route can use it:
- **Create:** `Note.create({ ...req.body, owner: req.userId })` — I set the owner from the **token**, never from the request body, so a user can't fake ownership.
- **Read all:** `Note.find({ owner: req.userId })` — only their notes.
- **Read one / update / delete:** `Note.findOne({ _id: req.params.id, owner: req.userId })` (and the `findOneAndUpdate` / `findOneAndDelete` versions). This finds the note *only if it belongs to this user*. If it's someone else's, the query returns `null` and they get a `404` — they can't touch it and can't even tell it exists.

---

## 🐞 Mistakes & challenges I hit (and how I solved them)

*The real story — the parts that prove I built and debugged this myself.*

**1. A silent `require` vs `required` typo — and the lesson that "green" isn't "correct."**
I wrote `require: true` instead of `required: true` on a schema field. There was **no red squiggle**, so I assumed it was fine — but Mongoose silently *ignores* unknown options, which meant the field wasn't actually required. **Lesson:** a lack of errors doesn't mean correct behavior. Syntax errors shout; *logic* bugs stay quiet.

**2. Putting `req.body` code in the wrong place (twice).**
I tried to use `const { email } = req.body` at the top level of a file, and later even pasted route logic into the *model* file. **Lesson that finally stuck:** `req` and `res` only exist **inside a route handler** — Express hands them to you there and nowhere else. If code touches `req`, it lives inside `(req, res) => { ... }`, in the routes file.

**3. Forgetting `return` on early responses.**
My validation checks sent a response but didn't `return`, so the code kept running and tried to send a *second* response → the `Cannot set headers after they are sent` crash. **Lesson:** one request → exactly one response, and `return` in front of every early reply is how you guarantee it.

**4. Sending a status code the wrong way.**
I wrote `res.send(404)` and even `res.send(404:"...")` (a syntax error). The correct pattern is `res.status(code).json({ message })` — status and body are two separate, chained calls.

**5. Mixing up the token and the secret.**
When testing a protected route, I sent my `JWT_SECRET` as the token and got rejected. **Lesson:** the **secret** is the server's private signing key and never leaves the server; the **token** is the long `eyJ...` string the client receives at login and sends back. They are completely different things.

**6. "It's green" but the route didn't exist.**
My register route was written correctly but I forgot to *mount* it in `index.ts` — so it returned "Cannot POST /auth/register." **Lesson:** a route file does nothing until you plug it in with `app.use(...)`. (And separately: "connection refused" just means the server isn't running.)

---

## 🔧 How I'd change or extend this

I'd add **refresh tokens** (short-lived access token + long-lived refresh token) for better security. I'd validate request bodies with **Zod** for cleaner errors. I'd add **roles** (like admin vs normal user) for role-based authorization, and return **403 Forbidden** when a user is logged in but not allowed to do something (vs **401** when they're not logged in at all). I'd also add password-strength rules and rate-limiting on the login route to slow brute-force attempts.

---

## 💬 Questions they might ask — answered in my own words

**"How do you store passwords securely?"** — I hash them with bcrypt before saving (via a Mongoose pre-save hook), never in plain text. bcrypt salts each password and is deliberately slow. On login I hash the attempt and compare — I never decrypt.

**"Hashing vs encryption?"** — Encryption is two-way (reversible with a key); hashing is one-way. Passwords should be hashed.

**"What is a JWT and how does token auth work?"** — A signed token I issue at login. The client sends it on each request; a middleware verifies the signature with my server secret and identifies the user. It's stateless — no server-side sessions.

**"Is it safe to put data in a JWT?"** — The payload is readable by anyone (it's encoded, not encrypted), so I never put secrets in it. The signature just guarantees it hasn't been tampered with.

**"AuthN vs AuthZ?"** — Authentication is proving identity (login); authorization is what you're allowed to do (only your own notes).

**"401 vs 403?"** — 401 = not authenticated (no/invalid token); 403 = authenticated but not permitted.

**"How do you make sure a user only accesses their own data?"** — Every note stores an `owner` reference, and I scope every query by `owner: req.userId`, which comes from the verified token. Unauthorized access returns a 404.

---

## 🧠 The short version to remember

Users **register** and **log in**; passwords are **hashed with bcrypt** (never stored raw). On login I issue a **JWT** signed with a server secret — the client's wristband. A **middleware** verifies that token on protected routes and attaches the user's id to the request. Every note has an **`owner`**, and all note queries are scoped to `owner: req.userId`, so users only ever touch their own data. **Authentication = who you are; authorization = what you can access.**
