import { useState, useEffect, type FormEvent } from 'react'

type Note = { _id: string; title: string; content: string }

type NotesProps = {
  token: string
  onLogout: () => void
}

function Notes({ token, onLogout }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // fetch the user's notes once, when this screen first appears
  useEffect(() => {
    async function fetchNotes() {
      const res = await fetch('http://localhost:3000/notes', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const data = await res.json()
      setNotes(data)
    }
    fetchNotes()
  }, [])

  // create a new note — a sibling of useEffect, so the form below can reach it
  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const res = await fetch('http://localhost:3000/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    })
    const newNote = await res.json()
    if (!res.ok) {
      alert(newNote.message || 'Failed to create')
      return
    }

    setNotes([newNote, ...notes]) // add the new note to the top (new array, not a mutation)
    setTitle('')
    setContent('')
  }

  return (
    <div>
      <h1>My Notes</h1>
      <button onClick={onLogout}>Log out</button>

      <form onSubmit={handleCreate}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note..."
        />
        <button type="submit">Add note</button>
      </form>

      {notes.map((note) => (
        <div key={note._id}>
          <h3>{note.title}</h3>
          <p>{note.content}</p>
        </div>
      ))}
    </div>
  )
}

export default Notes
