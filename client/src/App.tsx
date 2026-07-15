import { useState, type FormEvent } from 'react'
import Notes from './components/Notes'
import { API } from './config'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      // if signing up, create the account first
      if (mode === 'signup') {
        const res = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const data = await res.json()
        if (!res.ok) { alert(data.message || 'Sign up failed'); return }
      }

      // then log in (runs for both signup and login)
      const res = await fetch(`${API}/auth/login`, {
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

  const isSignup = mode === 'signup'

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Second Brain</h1>
        <p className="subtitle">{isSignup ? 'Create your account' : 'Log in to your notes'}</p>

        <form className="form" onSubmit={handleSubmit}>
          {isSignup && (
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          )}
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
          <button className="btn btn-primary" type="submit">
            {isSignup ? 'Sign up' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setMode(isSignup ? 'login' : 'signup')}>
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default App
