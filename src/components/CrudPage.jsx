import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Database, Eraser, Pencil, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import api from '../api'

const cx = (...parts) => parts.filter(Boolean).join(' ')

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100'

const textareaClassName = `${inputClassName} min-h-[110px] resize-y`

const secondaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60'

const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60'

const dangerButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60'

const buildEmptyForm = (fields, idField) => {
  const empty = { [idField]: '' }
  fields.forEach((field) => {
    empty[field.name] = ''
  })
  return empty
}

const formatForInput = (value, type) => {
  if (value === null || value === undefined) {
    return ''
  }

  if (type === 'date') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  }

  if (type === 'datetime-local') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 16)
  }

  if (type === 'boolean') {
    return String(value)
  }

  return String(value)
}

const formatForDisplay = (value, type) => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (type === 'date') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString()
  }

  if (type === 'datetime-local') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
  }

  if (type === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
}

const coerceValue = (value, type) => {
  if (value === '') {
    return null
  }

  if (type === 'int') {
    return value === null ? null : Number.parseInt(value, 10)
  }

  if (type === 'number') {
    return value === null ? null : Number.parseFloat(value)
  }

  if (type === 'boolean') {
    if (value === true || value === false) return value
    return value === 'true'
  }

  return value
}

export default function CrudPage({
  title,
  endpoint,
  idField,
  fields,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  readOnlyMessage = '',
}) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(() => buildEmptyForm(fields, idField))
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isReadOnly = !canCreate && !canEdit && !canDelete
  const showForm = canCreate || (editingId !== null && canEdit)

  const formFields = useMemo(
    () => fields.filter((field) => field.inForm !== false),
    [fields],
  )
  const tableFields = useMemo(
    () => fields.filter((field) => field.inTable !== false),
    [fields],
  )

  const loadItems = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get(endpoint)
      setItems(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [endpoint])

  const handleChange = (event, field) => {
    const { value } = event.target
    setForm((prev) => ({ ...prev, [field.name]: value }))
  }

  const resetForm = () => {
    setForm(buildEmptyForm(fields, idField))
    setEditingId(null)
  }

  const handleEdit = (item) => {
    if (!canEdit) return

    const nextForm = { [idField]: item[idField] }
    fields.forEach((field) => {
      nextForm[field.name] = formatForInput(item[field.name], field.type)
    })
    setForm(nextForm)
    setEditingId(item[idField])
  }

  const handleDelete = async (itemId) => {
    if (!canDelete) return
    if (!window.confirm('Delete this record?')) return
    setError('')
    try {
      await api.delete(`${endpoint}/${itemId}`)
      await loadItems()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to delete record')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (editingId === null && !canCreate) return
    if (editingId !== null && !canEdit) return

    const payload = {}
    fields.forEach((field) => {
      payload[field.name] = coerceValue(form[field.name], field.type)
    })

    if (editingId !== null) {
      payload[idField] = editingId
    }

    try {
      setSaving(true)

      if (editingId === null) {
        await api.post(endpoint, payload)
      } else {
        await api.put(`${endpoint}/${editingId}`, payload)
      }

      resetForm()
      await loadItems()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  const visibleFormFields = formFields.length
  const requiredFields = formFields.filter((field) => field.required).length

  const renderFieldControl = (field) => {
    if (field.type === 'select') {
      return (
        <select
          value={form[field.name]}
          onChange={(event) => handleChange(event, field)}
          required={field.required}
          className={inputClassName}
        >
          <option value="">Select...</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={form[field.name]}
          onChange={(event) => handleChange(event, field)}
          required={field.required}
          rows={4}
          className={textareaClassName}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      )
    }

    if (field.type === 'boolean') {
      return (
        <select
          value={form[field.name]}
          onChange={(event) => handleChange(event, field)}
          required={field.required}
          className={inputClassName}
        >
          <option value="">Select...</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      )
    }

    const htmlType = field.type === 'int' || field.type === 'number' ? 'number' : field.type || 'text'

    return (
      <input
        type={htmlType}
        value={form[field.name]}
        onChange={(event) => handleChange(event, field)}
        required={field.required}
        className={inputClassName}
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    )
  }

  return (
    <div className="space-y-6 px-5 py-5 sm:px-6">
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {items.length} {items.length === 1 ? 'record' : 'records'}
                </span>
                {editingId !== null && (
                  <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    Editing #{editingId}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Update this form to create or maintain database-backed {title.toLowerCase()} records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                <Database className="h-3.5 w-3.5" />
                {visibleFormFields} fields
              </span>
              <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                {requiredFields} required
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {isReadOnly && readOnlyMessage && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              {readOnlyMessage}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {formFields.map((field) => {
                  const shouldSpanWide = field.type === 'textarea'

                  return (
                    <label
                      key={field.name}
                      className={cx(
                        'block space-y-2',
                        shouldSpanWide && 'md:col-span-2 xl:col-span-3',
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        {field.label}
                        {field.required && <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">Required</span>}
                      </span>
                      {renderFieldControl(field)}
                    </label>
                  )
                })}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  Changes here are sent directly to the API and stored in the database after submit.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" className={primaryButtonClassName} disabled={saving}>
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : editingId === null ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Saving...' : editingId === null ? `Create ${title}` : `Update ${title}`}
                  </button>
                  <button type="button" onClick={resetForm} className={secondaryButtonClassName} disabled={saving}>
                    <Eraser className="h-4 w-4" />
                    Clear form
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">Saved Records</h3>
              <p className="mt-1 text-sm text-slate-500">
                Review existing entries below and use the action buttons to edit or delete them.
              </p>
            </div>
            <span className="inline-flex self-start rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 sm:self-auto">
              {loading ? 'Refreshing records...' : `${items.length} loaded`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">Loading records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 sm:px-5">{idField}</th>
                  {tableFields.map((field) => (
                    <th key={field.name} className="px-4 py-3 sm:px-5">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right sm:px-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((item) => (
                  <tr key={item[idField]} className="align-top transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-medium text-slate-950 sm:px-5">{item[idField]}</td>
                    {tableFields.map((field) => (
                      <td key={field.name} className="px-4 py-3.5 text-slate-600 sm:px-5">
                        {formatForDisplay(item[field.name], field.type) || '—'}
                      </td>
                    ))}
                    <td className="px-4 py-3.5 sm:px-5">
                      <div className="flex flex-wrap justify-end gap-2">
                        {canEdit && (
                          <button type="button" onClick={() => handleEdit(item)} className={secondaryButtonClassName}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" onClick={() => handleDelete(item[idField])} className={dangerButtonClassName}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        )}
                        {!canEdit && !canDelete && <span className="text-xs font-medium text-slate-500">View only</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={tableFields.length + 2} className="px-4 py-12 text-center text-sm text-slate-500 sm:px-5">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
