import { useState } from "react"

function Chat({ token }: { token: string }) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setAnswer("")
    
    const res = await fetch("http://localhost:3000/ai/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ question }),
})
const data = await res.json()
setAnswer(data.answer)

    setLoading(false)
  }

  return (
    <div>
      <form onSubmit={handleAsk}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your notes..."
        />
        <button type="submit">Ask</button>
      </form>

      
      {loading && <p>Thinking…</p>}
{answer && <p>{answer}</p>}

    </div>
  )
}

export default Chat

