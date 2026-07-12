import { useState, type FormEvent } from 'react'
import Notes from './components/Notes'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
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
      setToken(data.token)
    } catch (error) {
      alert('Could not reach the server')
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  if (token) {
    return <Notes token={token} onLogout={handleLogout} />
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Second Brain</h1>
        <p className="subtitle">Log in to your notes</p>
        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button className="btn btn-primary" type="submit">Log in</button>
        </form>
      </div>
    </div>
  )
}

export default App
