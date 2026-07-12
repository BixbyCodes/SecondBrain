# ⚛️ React — Basics to Pro (Complete Guide)

> **Goal of this note:** read it, and you can write React yourself — components, state, effects, forms, data fetching. It's built around *repeatable recipes* and the *one idea* everything comes from. Keep it open while you build.

---

## 🧠 The ONE idea (everything comes from this)

> **You describe what the UI should look like for a given piece of data (state). When the state changes, React automatically re-draws the screen to match.**

You never touch the page directly (no `document.getElementById`). You just change **state**, and React re-renders. That's it. Every feature is a variation of: **user does something → change state → React re-draws.**

---

## 1️⃣ Components — the building blocks

A **component is just a function that returns UI (JSX).**

```tsx
function Hello() {
  return <h2>Hi, I'm Utsav</h2>
}
export default Hello
```

Rules:
- **Name starts with a Capital letter** (`Hello`, `NoteCard`) — lowercase is treated as a plain HTML tag.
- One component = one job. You build big screens by combining small components (like LEGO).
- `export default Hello` so other files can `import Hello from './Hello'`.

---

## 2️⃣ JSX — the HTML-looking stuff (and its rules)

JSX is HTML written inside JavaScript. Five rules that cover 95% of mistakes:

1. **`{ }` drops JavaScript into the markup** — values, math, anything:
   ```tsx
   <h2>{user.name}</h2>
   <p>{2 + 2}</p>
   ```
2. **It's `className`, not `class`** (`class` is a reserved word in JS).
3. **Some tags are self-closing** — `<input />`, `<img />`, `<br />`. They have **no closing tag and no content** — everything is attributes *inside* the tag:
   ```tsx
   <input value={text} placeholder="Title" />   ✅
   <input>value={text}</input>                   ❌
   ```
4. **A component must return ONE parent element.** Wrap siblings in a `<div>` or an empty **Fragment** `<>...</>`:
   ```tsx
   return (
     <>
       <h1>Title</h1>
       <p>Body</p>
     </>
   )
   ```
5. **Return multi-line JSX inside parentheses** `return ( ... )` — not `{ }`.

---

## 3️⃣ Showing logic in JSX (conditionals & lists)

**Show one of two things — ternary:**
```tsx
<p>{isOn ? "ON" : "OFF"}</p>
```

**Show something only if a condition is true — `&&`:**
```tsx
{error && <p className="error">{error}</p>}   // shows the <p> only if error exists
```

**Render a list — `.map()` (with a `key`):**
```tsx
{notes.map((note) => (
  <div key={note._id}>
    <h3>{note.title}</h3>
  </div>
))}
```
> 🔑 **`key`** must be a unique id on each item (like `_id`). React uses it to track which item is which. Forget it and you get a warning + subtle bugs.

---

## 4️⃣ Props — passing data *down* to a component

Props are how a parent hands data to a child. It looks like HTML attributes:

```tsx
// Parent:
<NoteCard title="Groceries" done={false} />

// Child — receives props (destructure them straight out):
function NoteCard({ title, done }: { title: string; done: boolean }) {
  return <h3>{title} {done ? "✅" : ""}</h3>
}
```

Key facts:
- **Props flow one way: parent → child.** A child can't change its props (they're read-only).
- **You can pass functions as props** (so a child can tell the parent something happened):
  ```tsx
  <Notes onLogout={handleLogout} />      // parent passes a function
  function Notes({ onLogout }) {
    return <button onClick={onLogout}>Log out</button>   // child calls it
  }
  ```
- In TypeScript, type your props with a `type`:
  ```tsx
  type Props = { title: string; onLogout: () => void }
  function Notes({ title, onLogout }: Props) { ... }
  ```

---

## 5️⃣ State — `useState` (the heart of React)

State is data that, when it changes, **re-renders the component.** A normal variable can't do that; `useState` can.

**The same 3 moves, every single time:**
```tsx
const [count, setCount] = useState(0)   // 1. create (with a starting value)
<p>{count}</p>                          // 2. read
setCount(count + 1)                     // 3. change (ONLY through the setter)
```

Works for any type:
```tsx
const [count, setCount] = useState(0)         // number
const [isOn, setIsOn]   = useState(false)     // boolean
const [text, setText]   = useState("")        // string
const [notes, setNotes] = useState([])        // array
const [user, setUser]   = useState(null)      // object (or null until loaded)
```

### ⚠️ The golden rule: never *mutate* state — always *replace* it
React only re-renders when you give it a **new** value. So don't change the old one — build a new one:

```tsx
// ADD to an array:
setNotes([newNote, ...notes])              // new array: newNote + all the old ones

// REMOVE from an array:
setNotes(notes.filter((n) => n._id !== id))

// UPDATE one item in an array:
setNotes(notes.map((n) => n._id === id ? { ...n, title: "new" } : n))

// UPDATE an object:
setUser({ ...user, name: "Utsav" })        // copy old, override one field
```
`...` (the spread) means "copy everything, then change what I list." **Never** do `notes.push(x)` — React won't see it.

### Functional update (when the new value depends on the old)
```tsx
setCount((prev) => prev + 1)   // safest way to bump a counter
```

---

## 6️⃣ Events — reacting to the user

Handlers must be a **function**, passed in `{ }`:

```tsx
<button onClick={() => setCount(count + 1)}>+1</button>
```
> Why the `() =>`? It means *"here's a function to run **when clicked**."* If you wrote `onClick={setCount(count + 1)}` it would run **immediately on render**, not on click. The arrow wraps it so it waits.

Reading from an input (`onChange`):
```tsx
<input onChange={(e) => setText(e.target.value)} />
```
- `e` is the event, `e.target.value` is what's currently typed in the box.

Forms (`onSubmit` + `preventDefault`):
```tsx
function handleSubmit(e) {
  e.preventDefault()          // stop the browser from reloading the page
  // ...do your thing
}
<form onSubmit={handleSubmit}> ... </form>
```

---

## 7️⃣ Controlled inputs & forms (the recipe)

A **controlled input** means React owns the value: `value` comes from state, `onChange` writes back to it.

```tsx
function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log(email, password)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
      <button type="submit">Log in</button>
    </form>
  )
}
```
Every form you ever build is this shape: one piece of state per field, `value` + `onChange` on each, `onSubmit` with `preventDefault`.

---

## 8️⃣ `useEffect` — doing things at the right time (& fetching data)

Normal code in a component runs on **every** render. `useEffect` lets you run code only at **specific** times — most often **once, when the component first appears.**

```tsx
useEffect(() => {
  // code to run
}, [])   // ← the dependency array
```

The dependency array controls *when* it runs:
| Array | Runs… |
|-------|-------|
| `[]` | **once**, on mount (most common — e.g. load data) |
| `[value]` | on mount **and** whenever `value` changes |
| *(omitted)* | after **every** render (rarely what you want) |

**Fetching data on load — the recipe** (memorize this shape):
```tsx
function Notes() {
  const [notes, setNotes] = useState([])

  useEffect(() => {
    async function load() {                    // async fn INSIDE the effect
      const res = await fetch("http://localhost:3000/notes")
      const data = await res.json()
      setNotes(data)                           // store it → re-renders
    }
    load()                                     // call it
  }, [])                                       // once, on mount

  return notes.map((n) => <p key={n._id}>{n.title}</p>)
}
```
> Why the inner `async function`? Because the `useEffect` callback itself can't be `async`. So you define an async function inside and call it.

**Cleanup (pro):** if an effect starts something ongoing (a timer, a subscription), return a function to stop it:
```tsx
useEffect(() => {
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)   // runs when the component leaves
}, [])
```

---

## 9️⃣ Talking to a backend — the `fetch` recipes

**GET (read):**
```tsx
const res = await fetch("http://localhost:3000/notes", {
  headers: { Authorization: `Bearer ${token}` },
})
const data = await res.json()
```

**POST / PATCH (send data):**
```tsx
const res = await fetch("http://localhost:3000/notes", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",       // "I'm sending JSON"
    Authorization: `Bearer ${token}`,         // the auth wristband
  },
  body: JSON.stringify({ title, content }),   // object → JSON string
})
const data = await res.json()
if (!res.ok) { /* handle error, e.g. show data.message */ }
```

Handling loading & errors properly (pro pattern):
```tsx
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState("")

useEffect(() => {
  async function load() {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Request failed")
      setData(await res.json())
    } catch (e) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }
  load()
}, [])

if (loading) return <p>Loading…</p>
if (error) return <p>{error}</p>
return <div>{/* show data */}</div>
```

---

## 🔟 Putting it together — files & composition

- **One component per file**, exported: `export default Notes`, imported: `import Notes from './components/Notes'`.
- **`App` composes everything** and decides what to show:
  ```tsx
  function App() {
    const [token, setToken] = useState(localStorage.getItem("token"))
    if (token) return <Notes token={token} onLogout={() => setToken(null)} />
    return <LoginForm onLogin={setToken} />
  }
  ```
  This is **conditional rendering** — using state to swap whole screens (a poor-man's router; real apps use React Router).
- **`localStorage`** persists small things (like a JWT) across refreshes: `localStorage.setItem("token", t)` / `.getItem("token")` / `.removeItem("token")`.

---

## ⚠️ The gotchas that bite everyone (a checklist)

- **Never mutate state** — always make a new array/object (`[...arr]`, `{...obj}`).
- **Every `.map()` needs a `key`.**
- **Handlers are functions:** `onClick={() => doIt()}`, not `onClick={doIt()}`.
- **`<input>` is self-closing**, attributes go *inside* the tag.
- **Don't `fetch` in the component body** → use `useEffect` (or it loops forever).
- **A controlled input needs both** `value` *and* `onChange`.
- **JSX returns one parent** — wrap siblings in `<div>` or `<>…</>`.

---

## 🧩 The recipes (your mental templates)

**A component with state:**
```tsx
function Thing() {
  const [x, setX] = useState(initial)
  return <button onClick={() => setX(newValue)}>{x}</button>
}
```

**A form field:** `value={x}` + `onChange={(e) => setX(e.target.value)}`

**Load data on mount:** `useEffect(() => { fetchAndSetState() }, [])`

**Show a list:** `{items.map(i => <div key={i.id}>{i.name}</div>)}`

**Swap screens:** `{isLoggedIn ? <App/> : <Login/>}`

If you can reach for the right recipe, you can build the app. That's the whole game.

---

## 🚀 Level up (pro — for later)

You don't need these yet, but here's the map so the words aren't scary:

- **`useRef`** — hold a value that survives renders *without* re-rendering (e.g. focus an input, keep a timer id).
- **`useContext`** — share data (like the logged-in user) across many components without passing props down every level ("prop drilling").
- **Custom hooks** — extract reusable logic into your own `useSomething()` function (e.g. `useAuth()`, `useFetch()`).
- **`useMemo` / `useCallback`** — performance: cache an expensive calculation or a function so it isn't recreated every render.
- **React Router** — real page URLs (`/login`, `/notes`).
- **React Query (TanStack Query)** — handles fetching, caching, loading/error states for you (replaces manual `useEffect` + `fetch`).

---

## 🗺️ One-page cheat sheet

```tsx
import { useState, useEffect } from "react"

function Component({ prop }: { prop: string }) {   // props in
  const [x, setX] = useState(initial)              // state

  useEffect(() => { /* on mount */ }, [])          // side effects

  function handle(e) { e.preventDefault(); setX(v) } // events

  return (                                         // one parent
    <div>
      <p>{x}</p>                                   {/* read state */}
      <input value={x} onChange={(e) => setX(e.target.value)} />  {/* controlled */}
      <button onClick={() => setX(next)}>go</button>              {/* event */}
      {cond ? <A/> : <B/>}                         {/* conditional */}
      {list.map((i) => <li key={i.id}>{i.name}</li>)}  {/* list */}
    </div>
  )
}
export default Component
```

**Remember the one idea:** change state → React re-renders → the screen matches your data. Everything else is details.
