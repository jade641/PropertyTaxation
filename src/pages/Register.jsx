import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
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
      await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
      })

      navigate('/login')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '520px', margin: '0 auto' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Username</span>
          <input name="username" value={form.username} onChange={handleChange} required />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Password</span>
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>First Name</span>
          <input name="firstName" value={form.firstName} onChange={handleChange} required />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Last Name</span>
          <input name="lastName" value={form.lastName} onChange={handleChange} required />
        </label>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Phone</span>
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      {error && <div style={{ color: 'crimson', marginTop: '12px' }}>{error}</div>}
      <p style={{ marginTop: '16px' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
