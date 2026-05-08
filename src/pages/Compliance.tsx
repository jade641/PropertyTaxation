import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FilterX,
  Lock,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  Users,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ReadOnlyBanner } from '../components/RoleGuard'
import {
  ActionButton,
  DetailDialog,
  DetailRow,
  Pill,
  SectionPanel,
  StatCard,
  WorkspaceHero,
  surfaceInputClassName,
  surfaceSelectClassName,
} from '../components/recordWorkspace'
import type { SurfaceTone } from '../components/recordWorkspace'
import api from '../api'
import { apiJson } from '../lib/apiClient'
import {
  buildBarangayMap,
  buildUserDisplayName,
  buildUserMap,
  formatCurrency,
  formatDateOnly,
  groupPaymentsByAssessment,
} from '../lib/liveData'
import type {
  ApiBarangay,
  ApiComplianceRecord,
  ApiPayment,
  ApiProperty,
  ApiTaxAssessment,
  ApiUsersResponse,
} from '../lib/liveData'

type CompStatus = 'Compliant' | 'Late' | 'Unpaid'

type Taxpayer = {
  id: string
  propertyId: string
  ownerName: string
  barangay: string
  propertyType: string
  totalDue: number
  totalPaid: number
  lastPaymentDate: string | null
  status: CompStatus
  taxYear: number
  daysOverdue: number
  record: ApiComplianceRecord
}

type DeadlineEvent = { day: number; month: number; label: string; type: 'quarterly' | 'annual' }

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const deadlines: DeadlineEvent[] = [
  { day: 31, month: 3, label: 'Q1 RPT Deadline', type: 'quarterly' },
  { day: 30, month: 6, label: 'Q2 RPT Deadline', type: 'quarterly' },
  { day: 30, month: 9, label: 'Q3 RPT Deadline', type: 'quarterly' },
  { day: 31, month: 12, label: 'Q4 RPT Deadline', type: 'quarterly' },
  { day: 31, month: 1, label: 'Annual RPT Deadline', type: 'annual' },
  { day: 30, month: 4, label: 'Annual Report Due', type: 'annual' },
]

const statusConfig = {
  Compliant: {
    Icon: CheckCircle,
    cls: 'bg-emerald-100 text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    row: '',
    rowBg: '',
  },
  Late: {
    Icon: Clock,
    cls: 'bg-amber-100 text-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    row: 'border-l-2 border-l-amber-400',
    rowBg: 'bg-amber-50/30',
  },
  Unpaid: {
    Icon: AlertCircle,
    cls: 'bg-red-100 text-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200',
    row: 'border-l-2 border-l-red-400',
    rowBg: 'bg-red-50/20',
  },
}

const exportCsv = (taxpayers: Taxpayer[]) => {
  const rows = [
    ['Case ID', 'Property', 'Owner', 'Barangay', 'Status', 'Tax Year', 'Total Due', 'Total Paid', 'Last Payment'],
    ...taxpayers.map((taxpayer) => [
      taxpayer.id,
      taxpayer.propertyId,
      taxpayer.ownerName,
      taxpayer.barangay,
      taxpayer.status,
      taxpayer.taxYear,
      taxpayer.totalDue,
      taxpayer.totalPaid,
      taxpayer.lastPaymentDate ?? '—',
    ]),
  ]
  const content = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `compliance-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function CalendarView() {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  const eventsForDay = (day: number) => deadlines.filter((deadline) => deadline.day === day && deadline.month === viewMonth + 1)

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <h3 className="text-slate-900">{monthNames[viewMonth]} {viewYear}</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (viewMonth === 0) {
                setViewMonth(11)
                setViewYear((year) => year - 1)
              } else {
                setViewMonth((month) => month - 1)
              }
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (viewMonth === 11) {
                setViewMonth(0)
                setViewYear((year) => year + 1)
              } else {
                setViewMonth((month) => month + 1)
              }
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-slate-400 py-1.5">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-lg overflow-hidden">
          {cells.map((day, index) => {
            const events = day ? eventsForDay(day) : []
            const isToday =
              day === today.getDate() &&
              viewMonth === today.getMonth() &&
              viewYear === today.getFullYear()

            return (
              <div key={index} className={`min-h-[64px] p-1.5 bg-white ${!day ? 'bg-slate-50/50' : ''} ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}>
                {day && (
                  <>
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-0.5 ${isToday ? 'text-white' : 'text-slate-700'}`}
                      style={isToday ? { backgroundColor: '#0d2137' } : {}}
                    >
                      {day}
                    </span>
                    {events.slice(0, 2).map((event, itemIndex) => (
                      <div key={itemIndex} title={event.label} className={`text-[9px] px-1 py-0.5 rounded truncate font-medium mb-0.5 ${event.type === 'annual' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {event.label}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AuditorSummaryCharts({
  counts,
  taxpayers,
  barangaySummary,
}: {
  counts: { All: number; Compliant: number; Late: number; Unpaid: number }
  taxpayers: Taxpayer[]
  barangaySummary: Array<{ name: string; compliant: number; late: number; unpaid: number }>
}) {
  const pieData = [
    { name: 'Compliant', value: counts.Compliant, color: '#10b981' },
    { name: 'Late', value: counts.Late, color: '#f59e0b' },
    { name: 'Unpaid', value: counts.Unpaid, color: '#ef4444' },
  ]
  const totalOutstanding = taxpayers.filter((taxpayer) => taxpayer.status !== 'Compliant').reduce((sum, taxpayer) => sum + (taxpayer.totalDue - taxpayer.totalPaid), 0)
  const complianceRate = counts.All > 0 ? Math.round((counts.Compliant / counts.All) * 100) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <h3 className="text-slate-900">Compliance Distribution</h3>
        </div>
        <div className="flex items-center gap-6">
          <div style={{ height: 160, width: 160, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} taxpayers`, name]} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-slate-600 font-medium">{item.name}</span>
                    <span className="text-sm font-bold text-slate-900">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ backgroundColor: item.color, width: `${counts.All > 0 ? (item.value / counts.All) * 100 : 0}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{counts.All > 0 ? ((item.value / counts.All) * 100).toFixed(1) : '0.0'}% of total</p>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Compliance Rate</span>
                <span className={`font-bold ${complianceRate >= 80 ? 'text-emerald-600' : complianceRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{complianceRate}%</span>
              </div>
              <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${complianceRate}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Based on current compliance records in the database.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <h3 className="text-slate-900">Barangay Compliance Breakdown</h3>
          </div>
        </div>
        <div style={{ height: 160 }}>
          {barangaySummary.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">No compliance records yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barangaySummary} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} width={58} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="compliant" stackId="a" fill="#10b981" name="Compliant" />
                <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
                <Bar dataKey="unpaid" stackId="a" fill="#ef4444" name="Unpaid" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {totalOutstanding > 0 && (
        <div className="lg:col-span-2 flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="p-2.5 bg-red-100 rounded-xl flex-shrink-0">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Total Outstanding Balance: {formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-red-600 mt-0.5">{counts.Late + counts.Unpaid} taxpayers have pending obligations from live compliance records.</p>
          </div>
        </div>
      )}
    </div>
  )
}

const mapStatus = (record: ApiComplianceRecord, totalDue: number, totalPaid: number): CompStatus => {
  if (totalDue > 0 && totalPaid >= totalDue) return 'Compliant'
  const rawStatus = String(record.status).toLowerCase()
  if (rawStatus === 'compliant' || rawStatus === 'resolved') return 'Compliant'
  if (rawStatus === 'late' || rawStatus === 'underreview') return 'Late'
  return 'Unpaid'
}

const compStatusTone = (status: CompStatus): SurfaceTone => {
  if (status === 'Compliant') return 'emerald'
  if (status === 'Late') return 'amber'
  return 'rose'
}

const tableActionButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200'

export default function Compliance() {
  const navigate = useNavigate()
  const { can, user } = useAuth()
  const canUpdate = can('compliance.update')
  const canExport = can('reporting.export')
  const isAuditor = user?.role === 'Auditor'
  const isReadOnly = !canUpdate

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<CompStatus | 'All'>('All')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'calendar' | 'summary'>(isAuditor ? 'summary' : 'list')
  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([])
  const [selected, setSelected] = useState<Taxpayer | null>(null)

  const loadCompliance = async () => {
    setLoading(true)
    setError('')
    try {
      const [records, properties, assessments, payments, usersResponse, barangays] = await Promise.all([
        apiJson<ApiComplianceRecord[]>('/ComplianceRecords'),
        apiJson<ApiProperty[]>('/Properties'),
        apiJson<ApiTaxAssessment[]>('/TaxAssessments'),
        apiJson<ApiPayment[]>('/Payments'),
        apiJson<ApiUsersResponse>('/Users'),
        apiJson<ApiBarangay[]>('/Barangays'),
      ])

      const propertyMap = new Map(properties.map((property) => [property.propertyId, property]))
      const assessmentMap = new Map(assessments.map((assessment) => [assessment.assessmentId, assessment]))
      const paymentTotals = groupPaymentsByAssessment(payments)
      const latestPayment = new Map<number, string>()
      payments
        .filter((payment) => payment.status === 'Completed' && payment.paymentDate)
        .forEach((payment) => {
          const current = latestPayment.get(payment.assessmentId)
          if (!current || new Date(payment.paymentDate as string).getTime() > new Date(current).getTime()) {
            latestPayment.set(payment.assessmentId, payment.paymentDate as string)
          }
        })

      const userMap = buildUserMap(usersResponse.users)
      const barangayMap = buildBarangayMap(barangays)
      const now = Date.now()

      const mappedTaxpayers = records
        .reduce<Taxpayer[]>((items, record) => {
          const property = propertyMap.get(record.propertyId)
          if (!property) return items

          const assessment = record.assessmentId ? assessmentMap.get(record.assessmentId) : undefined
          const totalDue = Number(assessment?.totalAmount ?? property.assessedValue ?? 0)
          const totalPaid = record.assessmentId ? Number(paymentTotals.get(record.assessmentId) ?? 0) : 0
          const owner = userMap.get(property.ownerId)
          const dueDate = new Date(record.dueDate)
          const daysOverdue = Number.isNaN(dueDate.getTime()) ? 0 : Math.max(0, Math.ceil((now - dueDate.getTime()) / 86400000))

          items.push({
            id: record.caseNumber || `COMP-${String(record.complianceRecordId).padStart(4, '0')}`,
            propertyId: property.propertyNumber || `PROP-${String(property.propertyId).padStart(4, '0')}`,
            ownerName: owner ? buildUserDisplayName(owner) : `Owner #${property.ownerId}`,
            barangay: barangayMap.get(property.barangayId)?.barangayName ?? 'Unknown Barangay',
            propertyType: property.propertyType,
            totalDue,
            totalPaid,
            lastPaymentDate: record.assessmentId ? latestPayment.get(record.assessmentId) ?? null : null,
            status: mapStatus(record, totalDue, totalPaid),
            taxYear: assessment?.taxYear ?? new Date(record.dueDate).getFullYear(),
            daysOverdue,
            record,
          })

          return items
        }, [])
        .sort((left, right) => right.taxYear - left.taxYear || left.ownerName.localeCompare(right.ownerName))

      setTaxpayers(mappedTaxpayers)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load compliance records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompliance()
  }, [])

  const filtered = useMemo(() => {
    return taxpayers.filter((taxpayer) => {
      const matchesStatus = filter === 'All' || taxpayer.status === filter
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        taxpayer.ownerName.toLowerCase().includes(query) ||
        taxpayer.propertyId.toLowerCase().includes(query) ||
        taxpayer.barangay.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [filter, search, taxpayers])

  const counts = useMemo(
    () => ({
      All: taxpayers.length,
      Compliant: taxpayers.filter((taxpayer) => taxpayer.status === 'Compliant').length,
      Late: taxpayers.filter((taxpayer) => taxpayer.status === 'Late').length,
      Unpaid: taxpayers.filter((taxpayer) => taxpayer.status === 'Unpaid').length,
    }),
    [taxpayers],
  )

  const totalOutstanding = taxpayers.filter((taxpayer) => taxpayer.status !== 'Compliant').reduce((sum, taxpayer) => sum + (taxpayer.totalDue - taxpayer.totalPaid), 0)

  const barangaySummary = useMemo(() => {
    const grouped = new Map<string, { compliant: number; late: number; unpaid: number }>()
    taxpayers.forEach((taxpayer) => {
      const current = grouped.get(taxpayer.barangay) ?? { compliant: 0, late: 0, unpaid: 0 }
      if (taxpayer.status === 'Compliant') current.compliant += 1
      if (taxpayer.status === 'Late') current.late += 1
      if (taxpayer.status === 'Unpaid') current.unpaid += 1
      grouped.set(taxpayer.barangay, current)
    })
    return Array.from(grouped.entries())
      .map(([name, values]) => ({ name, ...values }))
      .sort((left, right) => right.unpaid + right.late - (left.unpaid + left.late))
      .slice(0, 8)
  }, [taxpayers])

  const markCompliant = async (taxpayer: Taxpayer) => {
    if (!canUpdate) return
    try {
      await api.put(`/ComplianceRecords/${taxpayer.record.complianceRecordId}`, {
        ...taxpayer.record,
        status: 'Compliant',
        reviewedAt: new Date().toISOString(),
        reviewedBy: Number(user?.id ?? 0),
      })
      await loadCompliance()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update compliance record.')
    }
  }

  const hasFilters = search.trim().length > 0 || filter !== 'All'

  const resetFilters = () => {
    setSearch('')
    setFilter('All')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      <WorkspaceHero
        eyebrow="Compliance Monitoring"
        title="Live compliance status for every registered taxpayer and property."
        description="Track delinquencies, view payment obligations, and update compliance records directly from the live database. Auditors see summary charts and full data."
        actions={
          <div className="flex flex-wrap gap-2">
            {canUpdate && (
              <ActionButton icon={Plus} variant="primary" onClick={() => navigate('/app/compliance/manage')}>
                Manage Cases
              </ActionButton>
            )}
            {canExport ? (
              <ActionButton icon={Download} variant="secondary" onClick={() => exportCsv(filtered)}>
                Export
              </ActionButton>
            ) : (
              <ActionButton icon={Lock} variant="secondary" disabled>
                Export
              </ActionButton>
            )}
          </div>
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">{loading ? 'Loading' : `${taxpayers.length} total records`}</Pill>
            <Pill tone="emerald">{loading ? '—' : `${counts.Compliant} compliant`}</Pill>
            <Pill tone="amber">{loading ? '—' : `${counts.Late} late`}</Pill>
            <Pill tone="rose">{loading ? '—' : `${counts.Unpaid} unpaid`}</Pill>
          </div>
        }
      />

      {isReadOnly && (
        <ReadOnlyBanner message={`Read-Only Mode — ${user?.role} accounts can monitor compliance status and export data, but cannot update records.`} />
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Unable to load compliance data</p>
            <p className="mt-1 text-xs leading-5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Taxpayers"
          value={loading ? '—' : counts.All}
          hint="All compliance records currently loaded from the live database."
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Compliant"
          value={loading ? '—' : counts.Compliant}
          hint="Taxpayers who have fully settled their current obligations."
          icon={CheckCircle}
          tone="emerald"
        />
        <StatCard
          label="Late"
          value={loading ? '—' : counts.Late}
          hint="Taxpayers who are overdue but have made partial or pending payments."
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Unpaid"
          value={loading ? '—' : counts.Unpaid}
          hint="Taxpayers with no payment recorded for the current obligation."
          icon={AlertCircle}
          tone="rose"
        />
      </div>

      {totalOutstanding > 0 && view !== 'summary' && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <div className="rounded-xl bg-rose-100 p-2 flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-rose-900">Outstanding Balance: {formatCurrency(totalOutstanding)}</p>
            <p className="mt-1 text-xs leading-5 text-rose-700">{counts.Late + counts.Unpaid} taxpayers have pending obligations in the current compliance dataset.</p>
          </div>
          {isReadOnly && <Pill tone="amber">View Only</Pill>}
        </div>
      )}

      <SectionPanel
        title={view === 'summary' ? 'Compliance Summary' : view === 'calendar' ? 'Deadline Calendar' : 'Compliance Checklist'}
        description={
          view === 'summary' ? 'Distribution charts and barangay breakdown for the Auditor review.'
            : view === 'calendar' ? 'RPT quarterly and annual payment deadlines for the current year.'
            : 'Search and filter the live compliance list. Use the actions to update individual records.'
        }
        icon={ShieldCheck}
        badge={view === 'list' ? <Pill tone="slate">{loading ? 'Loading' : `${filtered.length} shown`}</Pill> : undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            {view === 'list' && hasFilters && (
              <ActionButton icon={FilterX} variant="ghost" onClick={resetFilters}>
                Reset filters
              </ActionButton>
            )}
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
              {isAuditor && (
                <button
                  onClick={() => setView('summary')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${view === 'summary' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                  Summary
                </button>
              )}
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                List View
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                Deadlines
              </button>
            </div>
          </div>
        }
        bodyClassName="space-y-5"
      >
        {view === 'summary' ? (
          <AuditorSummaryCharts counts={counts} taxpayers={taxpayers} barangaySummary={barangaySummary} />
        ) : view === 'calendar' ? (
          <CalendarView />
        ) : (
          <>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_200px]">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search owner, property, barangay..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className={`${surfaceInputClassName} pl-11`}
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</span>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as CompStatus | 'All')}
                  className={surfaceSelectClassName}
                >
                  <option value="All">All statuses ({counts.All})</option>
                  <option value="Compliant">Compliant ({counts.Compliant})</option>
                  <option value="Late">Late ({counts.Late})</option>
                  <option value="Unpaid">Unpaid ({counts.Unpaid})</option>
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Showing {loading ? '—' : filtered.length} of {taxpayers.length} records
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Click "Mark Compliant" on a record to update its status from the live database.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {search.trim() && <Pill tone="blue">Query: {search.trim().slice(0, 24)}</Pill>}
                  {filter !== 'All' && <Pill tone={compStatusTone(filter as CompStatus)}>{filter}</Pill>}
                  {!hasFilters && <Pill tone="slate">No active filters</Pill>}
                </div>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Loading compliance records...</div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No compliance records found.</div>
              ) : (
                filtered.map((taxpayer) => (
                  <article key={taxpayer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Pill tone="slate">{taxpayer.id}</Pill>
                      <Pill tone={compStatusTone(taxpayer.status)}>{taxpayer.status}</Pill>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{taxpayer.ownerName}</p>
                    <p className="text-xs text-slate-500 mt-1">{taxpayer.propertyId} • {taxpayer.barangay}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Due</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(taxpayer.totalDue)}</dd>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Paid</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(taxpayer.totalPaid)}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionButton icon={Eye} onClick={() => setSelected(taxpayer)} fluidOnMobile={false}>View</ActionButton>
                      {canUpdate && taxpayer.status !== 'Compliant' && (
                        <ActionButton icon={CheckCircle} variant="primary" onClick={() => markCompliant(taxpayer)} fluidOnMobile={false}>Mark Compliant</ActionButton>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Case</th>
                      <th className="px-5 py-3.5">Owner</th>
                      <th className="px-5 py-3.5">Barangay</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Due</th>
                      <th className="px-5 py-3.5 text-right">Paid</th>
                      <th className="px-5 py-3.5">Last Payment</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">Loading compliance records...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">No compliance records match the current filters.</td></tr>
                    ) : (
                      filtered.map((taxpayer) => {
                        const statusMeta = statusConfig[taxpayer.status]
                        const StatusIcon = statusMeta.Icon
                        return (
                          <tr key={taxpayer.id} className={`align-top transition-colors hover:bg-slate-50/80 ${statusMeta.rowBg} ${statusMeta.row}`}>
                            <td className="px-5 py-4">
                              <p className="text-sm font-semibold text-slate-950">{taxpayer.id}</p>
                              <p className="text-xs text-slate-500">{taxpayer.propertyId}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-slate-900">{taxpayer.ownerName}</p>
                              <p className="text-xs text-slate-500">{taxpayer.propertyType}</p>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-700">{taxpayer.barangay}</td>
                            <td className="px-5 py-4">
                              <Pill tone={compStatusTone(taxpayer.status)}>
                                <StatusIcon className="h-3.5 w-3.5" /> {taxpayer.status}
                              </Pill>
                            </td>
                            <td className="px-5 py-4 text-right text-sm text-slate-700">{formatCurrency(taxpayer.totalDue)}</td>
                            <td className="px-5 py-4 text-right text-sm font-semibold text-slate-950">{formatCurrency(taxpayer.totalPaid)}</td>
                            <td className="px-5 py-4 text-sm text-slate-700">{taxpayer.lastPaymentDate ? formatDateOnly(taxpayer.lastPaymentDate) : 'No payment yet'}</td>
                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <ActionButton
                                  icon={Eye}
                                  variant="secondary"
                                  className={`${tableActionButtonClass} text-sky-700 hover:border-sky-200 hover:bg-sky-50`}
                                  onClick={() => setSelected(taxpayer)}
                                  fluidOnMobile={false}
                                  aria-label={`View ${taxpayer.id}`}
                                />
                                {canUpdate && taxpayer.status !== 'Compliant' && (
                                  <ActionButton
                                    icon={CheckCircle}
                                    variant="primary"
                                    onClick={() => markCompliant(taxpayer)}
                                    fluidOnMobile={false}
                                    className="h-10 px-3 text-xs"
                                  >
                                    Mark Compliant
                                  </ActionButton>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </SectionPanel>

      {selected && (
        <DetailDialog
          title="Compliance Record"
          subtitle={`${selected.id} • ${selected.propertyId}`}
          badge={
            <Pill tone={compStatusTone(selected.status)}>
              {selected.status}
            </Pill>
          }
          onClose={() => setSelected(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setSelected(null)}>Close</ActionButton>
              {canUpdate && selected.status !== 'Compliant' && (
                <ActionButton icon={CheckCircle} variant="primary" onClick={() => { markCompliant(selected); setSelected(null) }}>
                  Mark Compliant
                </ActionButton>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total Due</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(selected.totalDue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total Paid</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(selected.totalPaid)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-1 sm:px-5">
              <DetailRow label="Property" value={selected.propertyId} />
              <DetailRow label="Owner" value={selected.ownerName} />
              <DetailRow label="Barangay" value={selected.barangay} />
              <DetailRow label="Property Type" value={selected.propertyType} />
              <DetailRow label="Tax Year" value={String(selected.taxYear)} />
              <DetailRow label="Due Date" value={formatDateOnly(selected.record.dueDate)} />
              <DetailRow label="Last Payment" value={selected.lastPaymentDate ? formatDateOnly(selected.lastPaymentDate) : 'No payment yet'} />
              <DetailRow label="Days Overdue" value={String(selected.daysOverdue ?? 0)} />
              <DetailRow label="Status" value={selected.status} emphasize />
            </div>
            {selected.record.notes && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{selected.record.notes}</p>
              </div>
            )}
          </div>
        </DetailDialog>
      )}
    </div>
  )
}
