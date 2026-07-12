# 🧠 Module 5 — The AI Layer: Chat With Your Notes (RAG)
### LLMs · Prompts · RAG · Embeddings · Vector Search

> **What this covers:** how I made my app *talk to an AI about my own notes* — the single most impressive feature in the project. This note goes from "what even is an LLM" to "how RAG works" to "how it scales with embeddings + vector search." Built to *understand* and to *explain in an interview*.

---

## 🧩 The AI toolkit at a glance

| Term | In one line | Why it matters |
|------|-------------|----------------|
| **LLM** | A model that predicts text (Gemini, Claude, GPT…) | The "brain" that writes answers |
| **Prompt** | The text you send the LLM | Your only steering wheel |
| **RAG** | Retrieve → Augment → Generate | How you make an LLM answer from *your* data |
| **Embedding** | Text turned into a list of numbers ("meaning fingerprint") | Lets you search by *meaning*, not keywords |
| **Vector search** | Find the items whose embeddings are closest | The "smart retrieve" step of RAG |

> 🎯 **The one-liner to say in an interview:**
> *"I built a RAG feature: the app retrieves the user's notes, stuffs the relevant ones into a prompt with grounding instructions, and asks an LLM to answer — so the AI responds from the user's actual data instead of making things up."*

---

## 🌍 The big picture: an LLM is brilliant but doesn't know *you*

An **LLM** (Large Language Model) like Gemini is astonishingly good at language — but it was trained on the public internet, so it has **no idea what's in your private notes.** Ask it *"what did I write about going fast?"* and it will either say "I don't know" or, worse, **make something up** (this is called a **hallucination** — the AI confidently inventing an answer).

So the whole game of "chat with your data" is: **how do I get the AI to answer using MY information?** The answer is **RAG.**

---

## 🤖 Part 1 — Talking to an LLM (the basics)

Before anything clever, I just got my server talking to Gemini. An LLM API call is simple: **send text (a prompt), get text back.**

```ts
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash",
  contents: "Say hello in one sentence.",
});
console.log(response.text);   // the model's reply as a string
```

I wrapped that in a normal Express route — `POST /ai/ask` — to confirm the connection worked. The API key is a **secret**, so it lives in `server/.env` as `GEMINI_API_KEY` (never in code), exactly like my database password.

> 💡 **Provider-agnostic:** I used **Google Gemini** (generous free tier). The *concepts* are identical for Claude, GPT, etc. — swapping providers is just changing the SDK and the call, a few lines. That's worth saying in an interview: you understand RAG, not just one vendor.

---

## 🧠 Part 2 — RAG: the core idea

**RAG = Retrieve → Augment → Generate.** In plain English:

1. **Retrieve** — grab the relevant information (here: the user's notes from MongoDB).
2. **Augment** — paste that information into the prompt as *context*.
3. **Generate** — ask the LLM to answer the question *using that context*.

The insight is almost silly once you see it: **the AI doesn't know your notes, so you literally hand them to it in the prompt.** You're not "training" the AI on your data — you're giving it the relevant pages right before you ask the question, like handing a smart assistant a folder and saying "answer from this."

### Why not just...?
- **…ask the LLM directly?** It doesn't have your notes, and it'll hallucinate.
- **…fine-tune / re-train the model on my notes?** Expensive, slow, and it goes stale the moment you add a new note. RAG uses your *live* data every time — add a note, and the AI can use it instantly.

---

## 📐 Part 3 — How my `/ai/chat` route works (the RAG code)

This route is **protected** — it needs to know *whose* notes to read, so it uses my auth middleware and `req.userId`. Read it as the three RAG steps:

```ts
router.post("/chat", protect, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: "Question is required" });

    // 1) RETRIEVE — this user's notes
    const notes = await Note.find({ owner: req.userId });

    // 2) AUGMENT — turn notes into context, wrap in a grounding prompt
    const context = notes.map((n) => `Title: ${n.title}\n${n.content}`).join("\n\n");
    const prompt = `You are a helpful assistant for the user's personal notes.
Answer using ONLY the notes below. If the answer isn't in them, say you don't know.

NOTES:
${context}

QUESTION: ${question}`;

    // 3) GENERATE — ask the LLM, grounded in the notes
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ answer: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "AI chat failed" });
  }
});
```

### 🔑 Prompt engineering — the quiet hero
Look at that instruction line: *"Answer using ONLY the notes below. If the answer isn't in them, say you don't know."* That single sentence is what:
- **Grounds** the answer in real data, and
- **Prevents hallucination** — it tells the model not to invent things when the notes don't cover it.

**Prompt engineering** = carefully wording the instructions + context so the model behaves. It's a real skill, and this is the simplest, most important example of it.

---

## 🎨 Part 4 — The chat box (frontend)

On the React side, a small `Chat` component: it holds the `question` and `answer` in state, POSTs to `/ai/chat` with the JWT, and shows the reply.

```tsx
function Chat({ token }: { token: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAnswer("");
    const res = await fetch("http://localhost:3000/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  }

  return (
    <div>
      <form onSubmit={handleAsk}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about your notes..." />
        <button type="submit">Ask</button>
      </form>
      {loading && <p>Thinking…</p>}
      {answer && <p>{answer}</p>}
    </div>
  );
}
```
Nothing new here vs the rest of the frontend — it's a controlled input + a `fetch` (sending the JWT so the protected route knows who's asking) + showing the result. The AI complexity all lives on the backend.

---

## 🔍 Part 5 — Making "Retrieve" SMART: embeddings & vector search

*(This is the next level — how the feature scales, and how every real "chat with your data" product works. Worth understanding deeply; it's the part that makes you sound senior.)*

### The problem with my current version
Right now step 1 grabs **all** the user's notes and stuffs them into the prompt. That's fine for 5 notes. But with 5,000 notes:
- they won't **fit** — every model has a **context window** (a max amount of text it can read at once),
- it's **slow and expensive** (you pay per token/word sent),
- and it's **noisy** — burying the 2 relevant notes in 5,000 makes answers worse.

So I need to retrieve **only the notes relevant to the question.** But "relevant" isn't keyword matching — if I ask about "speed," a note titled "going fast" should match even though it shares no words. I need to search by **meaning.** That's what embeddings do.

### Embeddings — turning meaning into numbers
An **embedding** is a list of numbers (a **vector**, e.g. 768 numbers) that represents the *meaning* of a piece of text. The magic property: **texts with similar meaning get similar numbers.** "going fast" and "high speed" land close together; "banana bread recipe" lands far away.

```ts
// generate an embedding for a note (Gemini)
const e = await ai.models.embedContent({
  model: "gemini-embedding-001",
  contents: note.content,
});
// e is a vector like [0.021, -0.44, 0.13, ...] — the note's "meaning fingerprint"
```

You compute an embedding **once per note** (when it's saved) and store it *on the note*.

### Vector search — finding the closest meanings
When a question comes in, you:
1. Embed the **question** into a vector.
2. Find the notes whose vectors are **closest** to it (closeness = similar meaning; measured with **cosine similarity**).
3. Take the top few and use *only those* as the RAG context.

Doing this fast over millions of vectors is what a **vector database** / **vector index** is for. **MongoDB Atlas Vector Search** does it right inside the database I already use — I'd add a vector index and run a `$vectorSearch` query.

### The upgraded RAG flow
```
Question
  → embed the question
  → vector-search the notes for the top 3 most similar
  → put ONLY those 3 in the prompt
  → ask the LLM
  → grounded answer
```
Same three RAG steps — just a **smart retrieve** instead of "grab everything." This is exactly how ChatGPT-over-your-docs, Notion AI, etc. work under the hood.

---

## 🐞 Mistakes & challenges I hit (and how I solved them)

**1. `req.body` was undefined — middleware order.**
My `/ai` routes were mounted *before* `app.use(express.json())`, so the JSON body parser never ran for them. **Lesson:** middleware runs in the order you register it — `express.json()` must come **before** any route that reads `req.body`.

**2. `404 — model no longer available.`**
I used `gemini-2.5-flash`, which was deprecated for new accounts. The error literally said "use a newer model." **Lesson:** AI model names change fast; read the error, swap the model (`gemini-3.5-flash`). *A changing error means progress* — this came *after* the middleware fix, meaning the request finally reached the AI.

**3. Wrong status-code syntax.**
I wrote `res.status(400, "msg")`. `res.status()` takes only the code — the message goes in a chained `.json()`: `res.status(400).json({ message: "..." })`.

**4. "Wrote it but didn't plug it in" (twice).**
My auth route existed but wasn't `app.use()`-mounted; my `Chat` component existed but wasn't rendered in `Notes`. **Lesson:** a route does nothing until you mount it, and a component does nothing until something renders it. Building ≠ wiring.

**5. Keeping the API key safe.**
The AI key is a secret → `.env`, git-ignored, loaded with `dotenv`. Same discipline as the DB password.

---

## 🔧 How I'd change or extend this

- **Smart retrieve** — embeddings + Atlas Vector Search (Part 5) so it scales.
- **Streaming** — stream the answer word-by-word (like ChatGPT) instead of waiting for the whole thing.
- **Citations** — return *which* notes the answer came from, so the user can trust it.
- **Conversation memory** — send the recent chat history so follow-up questions work ("and what about the second one?").
- **Guardrails & limits** — rate-limit the endpoint (AI calls cost money) and validate input.
- **Swap the model/provider** — Gemini ↔ Claude ↔ GPT is a few lines, because the architecture is provider-agnostic.

---

## 💬 Questions they might ask — answered in my own words

**"What is RAG and why use it?"** — Retrieval-Augmented Generation. The LLM doesn't know my private data, so I retrieve the relevant pieces and put them in the prompt as context. It lets the AI answer from live, private data without retraining, and reduces hallucination.

**"Why not just fine-tune the model on the notes?"** — Fine-tuning is expensive, slow, and goes stale — you'd retrain every time a note changes. RAG uses the current data on every request; add a note and it's instantly usable.

**"How do you stop the AI from making things up?"** — Grounding: I instruct it to answer *only* from the provided notes and to say "I don't know" otherwise, and I feed it real context. (Citations would strengthen this further.)

**"What's an embedding?"** — A vector of numbers representing the *meaning* of text, where similar meanings are numerically close. It lets you search by meaning instead of keywords.

**"What's vector search / a vector database?"** — Given a query embedding, it finds the stored embeddings that are most similar (e.g. cosine similarity), fast, at scale. MongoDB Atlas Vector Search does this inside Mongo.

**"What's a context window?"** — The max amount of text a model can consider at once. It's why you can't just stuff unlimited notes into a prompt — and why smart retrieval matters.

**"How would you scale this to millions of notes?"** — Don't send them all. Embed each note, store the vectors, and at query time vector-search for the top-k most relevant, sending only those to the LLM.

**"How do you keep the API key secure?"** — Environment variable in a git-ignored `.env`, loaded with dotenv; never in the client or the repo.

---

## 🧠 The short version to remember

An LLM is smart but doesn't know my data, so I use **RAG**: **retrieve** the user's notes → **augment** the prompt with them (plus a grounding instruction that stops hallucination) → **generate** an answer with the LLM. The frontend is just a controlled input + a `fetch` to a protected `/ai/chat` route. Today it stuffs *all* notes in the prompt; to scale, I'd upgrade "retrieve" to **embeddings + vector search** so it pulls only the *relevant* notes by meaning. Same three steps — smarter retrieve. **The AI doesn't learn your data; you hand it the right pieces at question time.**
