import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { AccessDenied } from '../../components/RoleGuard'
import { useAuth } from '../../context/AuthContext'

const EMPTY_ARRAY = []

const getArrayData = (result) => {
  if (result.status !== 'fulfilled') return EMPTY_ARRAY
  return Array.isArray(result.value?.data) ? result.value.data : EMPTY_ARRAY
}

const getUsersData = (result) => {
  if (result.status !== 'fulfilled') return EMPTY_ARRAY
  return Array.isArray(result.value?.data?.users) ? result.value.data.users : EMPTY_ARRAY
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))
}

const formatDateTime = (value) => {
  if (!value) return 'No activity yet'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

export default function DashboardDataPage() {
  const { can } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    properties: [],
    assessments: [],
    payments: [],
    documents: [],
    complianceRecords: [],
    reportRecords: [],
    logs: [],
    users: [],
  })

  if (!can('dashboard.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    const requests = [
      api.get('/Properties'),
      api.get('/TaxAssessments'),
      api.get('/Payments'),
      can('filing.view') ? api.get('/PropertyDocuments') : Promise.resolve({ data: [] }),
      can('compliance.view') ? api.get('/ComplianceRecords') : Promise.resolve({ data: [] }),
      can('reporting.view') ? api.get('/ReportRecords') : Promise.resolve({ data: [] }),
      can('audit.view') ? api.get('/ActivityLogs') : Promise.resolve({ data: [] }),
      can('users.view')
        ? api.get('/Users', { params: { page: 1, pageSize: 200 } })
        : Promise.resolve({ data: { users: [] } }),
    ]

    const results = await Promise.allSettled(requests)

    setData({
      properties: getArrayData(results[0]),
      assessments: getArrayData(results[1]),
      payments: getArrayData(results[2]),
      documents: getArrayData(results[3]),
      complianceRecords: getArrayData(results[4]),
      reportRecords: getArrayData(results[5]),
      logs: getArrayData(results[6]),
      users: getUsersData(results[7]),
    })

    if (results.some((result) => result.status === 'rejected')) {
      setError('Some dashboard panels could not be loaded. The available data below still comes from the database.')
    }

    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const summary = useMemo(() => {
    const completedPayments = data.payments.filter((item) => item.status === 'Completed')
    const totalCollected = completedPayments.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0)
    const totalAssessed = data.assessments.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
    const outstanding = totalAssessed - totalCollected
    const openCompliance = data.complianceRecords.filter((item) => ['Pending', 'Late', 'Unpaid', 'UnderReview'].includes(item.status)).length

    return {
      totalCollected,
      outstanding,
      openCompliance,
      completedPayments: completedPayments.length,
    }
  }, [data])

  const recentPayments = [...data.payments]
    .sort((left, right) => new Date(right.paymentDate || 0) - new Date(left.paymentDate || 0))
    .slice(0, 5)

  const recentLogs = [...data.logs]
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 6)

  const cards = [
    { label: 'Properties', value: data.properties.length, helper: 'Registered property records' },
    { label: 'Assessments', value: data.assessments.length, helper: 'Tax assessment rows' },
    { label: 'Collected', value: formatCurrency(summary.totalCollected), helper: `${summary.completedPayments} completed payments` },
    { label: 'Outstanding', value: formatCurrency(summary.outstanding), helper: 'Open assessment balance' },
    { label: 'Compliance Cases', value: data.complianceRecords.length, helper: `${summary.openCompliance} still open` },
    { label: 'Reports', value: data.reportRecords.length, helper: 'Stored report records' },
    { label: 'Documents', value: data.documents.length, helper: 'Filed database records' },
    { label: 'Managed Users', value: data.users.length, helper: 'Admin, Accountant, Auditor, Staff' },
  ]

  const shortcuts = [
    can('property.view') && { label: 'Open Property Registry', path: '/app/property-registration' },
    can('tax.view') && { label: 'Open Tax Calculation', path: '/app/tax-calculation' },
    can('payment.view') && { label: 'Open Payment Management', path: '/app/payment-management' },
    can('compliance.view') && { label: 'Open Compliance', path: '/app/compliance' },
    can('reporting.view') && { label: 'Open Reporting', path: '/app/reporting' },
    can('users.view') && { label: 'Open User Management', path: '/app/users' },
  ].filter(Boolean)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Live database summary across property, tax, payment, compliance, filing, reporting, audit, and user modules.</p>
        </div>
        <button type="button" onClick={loadDashboard} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-slate-900">Recent Payments</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPayments.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">No payment records in the database yet.</div>
            ) : (
              recentPayments.map((payment) => (
                <div key={payment.paymentId} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{payment.paymentReference}</p>
                      <p className="text-xs text-slate-500">Assessment #{payment.assessmentId} · Payer #{payment.payerId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{formatCurrency(payment.amountPaid)}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(payment.paymentDate)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-slate-900">Recent Audit Activity</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLogs.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">No audit activity captured yet.</div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.logId} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{log.action}</p>
                      <p className="text-xs text-slate-500">{log.module} · {log.severity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                  {log.description && <p className="mt-1 text-xs text-slate-600">{log.description}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-slate-900">Module Shortcuts</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {shortcuts.map((item) => (
            <button key={item.path} type="button" onClick={() => navigate(item.path)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}