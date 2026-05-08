import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        username: form.username,
        password: form.password,
      })

      const token = response.data?.token
      if (token) {
        localStorage.setItem('taxsync.token', token)
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '420px', margin: '0 auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Username or Email</span>
          <input name="username" value={form.username} onChange={handleChange} required />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Password</span>
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      {error && <div style={{ color: 'crimson', marginTop: '12px' }}>{error}</div>}
      <p style={{ marginTop: '16px' }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
