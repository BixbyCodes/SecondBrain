import { useState, useEffect, type FormEvent } from 'react'
import { io } from 'socket.io-client'
import Chat from './Chat'

type Note = { _id: string; title: string; content: string }

type NotesProps = {
  token: string
  onLogout: () => void
}

const API = 'http://localhost:3000'

function Notes({ token, onLogout }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // which note is being edited, plus its draft values
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  // fetch notes once, when the screen first appears
  useEffect(() => {
    async function fetchNotes() {
      const res = await fetch(`${API}/notes`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setNotes(data)
    }
    fetchNotes()
  }, [])

  // live sync: created / updated / deleted notes push in over the socket
  useEffect(() => {
    const socket = io(API, { auth: { token } })

    socket.on('noteCreated', (note: Note) => {
      setNotes((prev) => [note, ...prev])
    })
    socket.on('noteUpdated', (note: Note) => {
      setNotes((prev) => prev.map((n) => (n._id === note._id ? note : n)))
    })
    socket.on('noteDeleted', (id: string) => {
      setNotes((prev) => prev.filter((n) => n._id !== id))
    })

    return () => { socket.disconnect() }
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const res = await fetch(`${API}/notes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title, content }),
    })
    const newNote = await res.json()
    if (!res.ok) {
      alert(newNote.message || 'Failed to create')
      return
    }
    // the socket 'noteCreated' event adds it to the list (on every tab)
    setTitle('')
    setContent('')
  }

  async function handleDelete(id: string) {
    await fetch(`${API}/notes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    // the socket 'noteDeleted' event removes it from the list
  }

  function startEdit(note: Note) {
    setEditingId(note._id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  async function handleUpdate(e: FormEvent, id: string) {
    e.preventDefault()
    await fetch(`${API}/notes/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ title: editTitle, content: editContent }),
    })
    setEditingId(null)
    // the socket 'noteUpdated' event refreshes the note in the list
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>My Notes</h1>
        <button className="btn btn-ghost" onClick={onLogout}>Log out</button>
      </header>

      <Chat token={token} />

      <form className="note-form" onSubmit={handleCreate}>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <textarea
          className="input textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note..."
        />
        <button className="btn btn-primary" type="submit">Add note</button>
      </form>

      {notes.length === 0 ? (
        <p className="empty">No notes yet — add your first one above ✍️</p>
      ) : (
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note._id} className="note-card">
              {editingId === note._id ? (
                <form className="form" onSubmit={(e) => handleUpdate(e, note._id)}>
                  <input
                    className="input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <textarea
                    className="input textarea"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="note-actions">
                    <button className="btn btn-primary btn-sm" type="submit">Save</button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h3>{note.title}</h3>
                  <p>{note.content}</p>
                  <div className="note-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(note)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(note._id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notes
