import { useState, type FormEvent } from 'react'
import Notes from './components/Notes'   // ← the new component (next step)

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))  // ← remember login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.message || 'Login failed'); return }
      localStorage.setItem('token', data.token)
      setToken(data.token)          // ← NEW: updating state switches to the Notes view
    } catch (error) {
      alert('Could not reach the server')
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  // 👇 conditional rendering: logged in? show Notes. Otherwise, show login.
  if (token) {
    return <Notes token={token} onLogout={handleLogout} />
  }

  return (
    <div>
      <h1>Log in to Second Brain</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Log in</button>
      </form>
    </div>
  )
}

export default App
