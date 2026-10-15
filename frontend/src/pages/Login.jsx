import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './pages.css'

function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    setMessage('')
    setLoading(true)

    try {

      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Login failed')
        setLoading(false)
        return
      }

      // Store logged-in user information
      localStorage.setItem('user', JSON.stringify(data.user))

      // Store JWT token for authenticated API requests
      if (data.token) {
        localStorage.setItem('token', data.token)
      }

      setMessage('Login successful!')

      // Redirect according to the user's role
      if (data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }

    } catch (error) {

      console.error('Login error:', error)
      setMessage('Unable to connect to the server')

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          🌾 AgroShare
        </div>

        <h2>Welcome Back</h2>

        <p className="auth-subtitle">
          Login to your farmer account
        </p>

        <form onSubmit={handleLogin}>

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {message && (
            <p className="auth-message">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <p className="auth-bottom">
          Don't have an account?
          {' '}
          <Link to="/register">Register here</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>

      </div>

    </div>
  )
}

export default Login