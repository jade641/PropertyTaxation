import { useEffect, useMemo, useState } from 'react'
import api from '../../api'
import { AccessDenied } from '../../components/RoleGuard'
import { useAuth } from '../../context/AuthContext'

const CREATE_ROLES = ['Accountant', 'Auditor', 'Staff']
const MANAGED_ROLES = ['Admin', 'Accountant', 'Auditor', 'Staff']
const STATUSES = ['Active', 'Inactive', 'Suspended', 'Pending']

const EMPTY_FORM = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'Staff',
  status: 'Active',
}

const formatDateTime = (value) => {
  if (!value) return 'Never'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

export default function UsersManagementPage() {
  const { can, user } = useAuth()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingUser, setEditingUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  if (!can('users.view')) {
    return <AccessDenied requiredRole="Admin" />
  }

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/Users', {
        params: { page: 1, pageSize: 200 },
      })
      setUsers(Array.isArray(response.data?.users) ? response.data.users : [])
    } catch (err) {
      setError(err?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return users

    return users.filter((item) => {
      return [item.username, item.email, item.firstName, item.lastName, item.role, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [search, users])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingUser(null)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEdit = (item) => {
    setEditingUser(item)
    setForm({
      username: item.username || '',
      email: item.email || '',
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      phone: item.phone || '',
      role: item.role || 'Staff',
      status: item.status || 'Active',
    })
    setMessage('')
    setError('')
  }

  const handleDelete = async (userId) => {
    if (Number(user?.id) === Number(userId)) {
      setError('You cannot delete the currently signed-in admin account.')
      return
    }

    if (!window.confirm('Delete this user account?')) return

    setError('')
    setMessage('')

    try {
      await api.delete(`/Users/${userId}`)
      await loadUsers()
      if (editingUser?.userId === userId) {
        resetForm()
      }
      setMessage('User deleted successfully.')
    } catch (err) {
      setError(err?.message || 'Failed to delete user')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (editingUser) {
        await api.put(`/Users/${editingUser.userId}`, {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          role: form.role,
          status: form.status,
        })
        setMessage('User updated successfully.')
      } else {
        const response = await api.post('/Users', {
          username: form.username,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          role: form.role,
        })

        const createdUserId = response.data?.userId
        if (createdUserId && form.status !== 'Active') {
          await api.put(`/Users/${createdUserId}/status`, { status: form.status })
        }

        setMessage('User created successfully. Initial password is managed by the backend configuration.')
      }

      resetForm()
      await loadUsers()
    } catch (err) {
      setError(err?.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const roleOptions = editingUser ? MANAGED_ROLES : CREATE_ROLES

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-slate-900 tracking-tight">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create and maintain Admin, Accountant, Auditor, and Staff accounts stored in the users table.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        New users receive the initial password configured on the backend. Admin creation stays system-controlled; this screen creates Accountant, Auditor, and Staff accounts.
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-slate-900">{editingUser ? 'Edit User' : 'Create User'}</h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm text-slate-600">
              <span>Username</span>
              <input name="username" value={form.username} onChange={handleChange} required disabled={Boolean(editingUser)} className="rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              <span>First Name</span>
              <input name="firstName" value={form.firstName} onChange={handleChange} required className="rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              <span>Last Name</span>
              <input name="lastName" value={form.lastName} onChange={handleChange} required className="rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              <span>Phone</span>
              <input name="phone" value={form.phone} onChange={handleChange} className="rounded-lg border border-slate-200 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleChange} className="rounded-lg border border-slate-200 px-3 py-2">
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-slate-600">
              <span>Status</span>
              <select name="status" value={form.status} onChange={handleChange} className="rounded-lg border border-slate-200 px-3 py-2">
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
                Clear
              </button>
            </div>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-slate-900">Managed Users</h2>
              <p className="text-xs text-slate-500">Accounts shown here are backed by the database.</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item) => (
                    <tr key={item.userId} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.firstName} {item.lastName}</div>
                        <div className="text-xs text-slate-500">{item.username} · {item.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.role}</td>
                      <td className="px-4 py-3 text-slate-600">{item.status}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(item.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(item.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleEdit(item)} className="rounded border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.userId)}
                            disabled={Number(user?.id) === Number(item.userId)}
                            className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}