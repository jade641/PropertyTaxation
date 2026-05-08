import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileDown,
  Home,
  Lock,
  TrendingDown,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Receipt,
  CheckCircle2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { ReadOnlyBanner } from '../components/RoleGuard'
import { Pill, SectionPanel, StatCard, WorkspaceHero } from '../components/recordWorkspace'
import { apiJson } from '../lib/apiClient'
import {
  buildMonthlyPaymentSeries,
  formatCurrency,
  startOfMonthLabels,
} from '../lib/liveData'
import type {
  ApiActivityLog,
  ApiComplianceRecord,
  ApiPayment,
  ApiProperty,
  ApiReportRecord,
  ApiTaxAssessment,
} from '../lib/liveData'

type AlertItem = {
  id: string
  type: 'critical' | 'deadline' | 'info'
  title: string
  desc: string
  time: string
}

type RecentPayment = {
  id: string
  owner: string
  property: string
  amount: number
  date: string
}

type FlaggedProperty = {
  id: string
  owner: string
  barangay: string
  assessed: string
  flag: string
}

const fmtCompact = (value: number) => {
  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₱${(value / 1000).toFixed(0)}K`
  return `₱${value.toFixed(0)}`
}

const statusColors = [
  { name: 'Compliant', color: '#10b981' },
  { name: 'Late', color: '#f59e0b' },
  { name: 'Unpaid', color: '#ef4444' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { can, user } = useAuth()

  const isAuditor = user?.role === 'Auditor'
  const canViewAudit = can('audit.view')
  const canViewReports = can('reporting.view')
  const canCreateProperty = can('property.create')
  const canCreatePayment = can('payment.create')
  const canViewIntelligence = user?.role === 'Admin' || user?.role === 'Accountant' || isAuditor

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState<ApiProperty[]>([])
  const [assessments, setAssessments] = useState<ApiTaxAssessment[]>([])
  const [payments, setPayments] = useState<ApiPayment[]>([])
  const [compliance, setCompliance] = useState<ApiComplianceRecord[]>([])
  const [reports, setReports] = useState<ApiReportRecord[]>([])
  const [logs, setLogs] = useState<ApiActivityLog[]>([])

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [propertiesResult, assessmentsResult, paymentsResult, complianceResult, reportsResult, logsResult] = await Promise.all([
          apiJson<ApiProperty[]>('/Properties'),
          apiJson<ApiTaxAssessment[]>('/TaxAssessments'),
          apiJson<ApiPayment[]>('/Payments'),
          apiJson<ApiComplianceRecord[]>('/ComplianceRecords'),
          canViewReports ? apiJson<ApiReportRecord[]>('/ReportRecords') : Promise.resolve([]),
          canViewAudit ? apiJson<ApiActivityLog[]>('/ActivityLogs') : Promise.resolve([]),
        ])

        if (!active) return

        setProperties(propertiesResult)
        setAssessments(assessmentsResult)
        setPayments(paymentsResult)
        setCompliance(complianceResult)
        setReports(reportsResult)
        setLogs(logsResult)
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [canViewAudit, canViewReports])

  const totalCollected = useMemo(
    () => payments.filter((payment) => payment.status === 'Completed').reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0),
    [payments],
  )

  const totalTaxDue = useMemo(
    () => assessments.reduce((sum, assessment) => sum + Number(assessment.totalAmount || 0), 0),
    [assessments],
  )

  const outstanding = Math.max(0, totalTaxDue - totalCollected)
  const activeAssessments = assessments.filter((assessment) => assessment.status !== 'Cancelled').length
  const activeReports = reports.filter((report) => report.status === 'Draft' || report.status === 'ForReview').length
  const criticalLogs = logs.filter((log) => ['critical', 'error', 'high'].includes(String(log.severity).toLowerCase())).length

  const complianceCounts = useMemo(() => {
    const counts = { Compliant: 0, Late: 0, Unpaid: 0 }
    const completedAssessmentIds = new Set(
      payments.filter((payment) => payment.status === 'Completed').map((payment) => payment.assessmentId),
    )

    compliance.forEach((record) => {
      const rawStatus = String(record.status).toLowerCase()
      if (rawStatus === 'compliant' || rawStatus === 'resolved') {
        counts.Compliant += 1
        return
      }
      if (rawStatus === 'late' || rawStatus === 'underreview') {
        counts.Late += 1
        return
      }
      if (record.assessmentId && completedAssessmentIds.has(record.assessmentId)) {
        counts.Compliant += 1
        return
      }
      counts.Unpaid += 1
    })

    return counts
  }, [compliance, payments])

  const paymentStatus = statusColors.map((entry) => ({
    ...entry,
    value: complianceCounts[entry.name as keyof typeof complianceCounts],
  }))
  const totalStatusCount = paymentStatus.reduce((sum, item) => sum + item.value, 0)

  const monthlyCollection = useMemo(() => {
    return buildMonthlyPaymentSeries(payments).map((item) => ({
      ...item,
      averageTarget: payments.length > 0 ? totalCollected / 12 : 0,
    }))
  }, [payments, totalCollected])

  const projectionData = useMemo(() => {
    const nonZero = monthlyCollection.filter((item) => item.collected > 0)
    if (nonZero.length === 0) return []
    const baseline = nonZero.slice(-3).reduce((sum, item) => sum + item.collected, 0) / Math.min(3, nonZero.length)
    const startMonth = new Date().getMonth()
    return Array.from({ length: 5 }, (_, index) => {
      const monthIndex = (startMonth + index + 1) % 12
      return {
        name: startOfMonthLabels[monthIndex],
        predicted: Math.round(baseline * (1 + index * 0.03)),
      }
    })
  }, [monthlyCollection])

  const recentPayments = useMemo<RecentPayment[]>(() => {
    const propertyMap = new Map(properties.map((property) => [property.propertyId, property]))
    const assessmentMap = new Map(assessments.map((assessment) => [assessment.assessmentId, assessment]))

    return payments
      .filter((payment) => payment.status === 'Completed' && payment.paymentDate)
      .sort((left, right) => new Date(right.paymentDate ?? 0).getTime() - new Date(left.paymentDate ?? 0).getTime())
      .slice(0, 5)
      .map((payment) => {
        const assessment = assessmentMap.get(payment.assessmentId)
        const property = assessment ? propertyMap.get(assessment.propertyId) : undefined
        return {
          id: payment.paymentReference || `PAY-${payment.paymentId}`,
          owner: property ? `Owner #${property.ownerId}` : `Payer #${payment.payerId}`,
          property: property?.propertyNumber || `Assessment #${payment.assessmentId}`,
          amount: Number(payment.amountPaid || 0),
          date: payment.paymentDate ?? '—',
        }
      })
  }, [assessments, payments, properties])

  const flaggedProperties = useMemo<FlaggedProperty[]>(() => {
    const propertyMap = new Map(properties.map((property) => [property.propertyId, property]))
    const assessmentMap = new Map(assessments.map((assessment) => [assessment.assessmentId, assessment]))

    return compliance
      .filter((record) => {
        const rawStatus = String(record.status).toLowerCase()
        return rawStatus === 'late' || rawStatus === 'unpaid' || rawStatus === 'underreview'
      })
      .slice(0, 4)
      .map((record) => {
        const property = propertyMap.get(record.propertyId)
        const assessment = record.assessmentId ? assessmentMap.get(record.assessmentId) : undefined
        const rawStatus = String(record.status).toLowerCase()
        return {
          id: property?.propertyNumber || `PROP-${record.propertyId}`,
          owner: property ? `Owner #${property.ownerId}` : `Property #${record.propertyId}`,
          barangay: `Barangay #${property?.barangayId ?? '—'}`,
          assessed: formatCurrency(Number(assessment?.assessedValue ?? property?.assessedValue ?? 0)),
          flag: rawStatus === 'underreview' ? 'Review Needed' : rawStatus === 'late' ? 'Late Payment' : 'Unpaid',
        }
      })
  }, [assessments, compliance, properties])

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = []

    if (outstanding > 0) {
      items.push({
        id: 'outstanding',
        type: 'critical',
        title: 'Outstanding balance requires follow-up',
        desc: `${formatCurrency(outstanding)} remains uncollected across active assessments.`,
        time: 'Now',
      })
    }

    if (complianceCounts.Late + complianceCounts.Unpaid > 0) {
      items.push({
        id: 'compliance',
        type: 'deadline',
        title: 'Open compliance follow-ups',
        desc: `${complianceCounts.Late + complianceCounts.Unpaid} compliance records are still late or unpaid.`,
        time: 'Today',
      })
    }

    if (activeReports > 0) {
      items.push({
        id: 'reports',
        type: 'info',
        title: 'Reports waiting for submission',
        desc: `${activeReports} report record(s) are still in draft or review state.`,
        time: 'This week',
      })
    }

    if (criticalLogs > 0) {
      items.push({
        id: 'audit',
        type: 'critical',
        title: 'Critical audit activity detected',
        desc: `${criticalLogs} critical audit log(s) were recorded and should be reviewed.`,
        time: 'Recent',
      })
    }

    return items.slice(0, 4)
  }, [activeReports, complianceCounts.Late, complianceCounts.Unpaid, criticalLogs, outstanding])

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      <WorkspaceHero
        eyebrow="Live Operations Dashboard"
        title="TaxSync Executive Overview"
        description="Connected to real property, tax, payment, compliance, and reporting data. Empty states stay empty until users actually encode records."
        footer={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">{user?.role ?? 'Unknown'}</Pill>
            <Pill tone="slate">{loading ? '—' : `${activeReports} reports in queue`}</Pill>
            {!loading && properties.length > 0 && <Pill tone="emerald">{properties.length} properties</Pill>}
            {!loading && outstanding > 0 && <Pill tone="rose">Outstanding balance</Pill>}
          </div>
        }
      />

      {isAuditor && <ReadOnlyBanner message="Read-Only Mode — Auditor accounts can inspect dashboard indicators and trace issues without modifying live records." />}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Unable to load dashboard data</p>
            <p className="mt-1 text-xs text-rose-600">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered Properties" value={loading ? '—' : properties.length} hint="Total properties encoded in the registry." icon={Home} tone="blue" />
        <StatCard label="Active Assessments" value={loading ? '—' : activeAssessments} hint="Tax assessments that are currently active." icon={ClipboardList} tone="emerald" />
        <StatCard label="Collected Payments" value={loading ? '—' : formatCurrency(totalCollected)} hint="Total amount of completed tax payments." icon={Wallet} tone="amber" />
        <StatCard label="Outstanding Balance" value={loading ? '—' : formatCurrency(outstanding)} hint="Uncollected amount from active assessments." icon={TrendingDown} tone="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionPanel
          title="Monthly Collection Trend"
          description="Completed payments grouped by month from live transactions."
          icon={Receipt}
          badge={<Pill tone="slate">{payments.length} payments</Pill>}
          className="xl:col-span-2"
          bodyClassName="pt-2"
        >
          <div style={{ height: 260 }}>
            {monthlyCollection.every((item) => item.collected === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No completed payments yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCollection} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={fmtCompact} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value)]} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="collected" fill="#0d2137" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionPanel>

        <SectionPanel
          title="Compliance Status"
          description="Distribution from live compliance records."
          icon={ShieldCheck}
          bodyClassName="space-y-3"
        >
          <div style={{ height: 180 }}>
            {totalStatusCount === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No compliance records yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {paymentStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {paymentStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{item.value}</span>
                  <span className="ml-1 text-xs text-slate-400">({totalStatusCount > 0 ? ((item.value / totalStatusCount) * 100).toFixed(1) : '0.0'}%)</span>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      {canViewIntelligence ? (
        <SectionPanel
          title="Operational Intelligence"
          description="Live projections and flagged records based on actual system activity."
          icon={Brain}
          badge={<Pill tone="blue">Admin · Accountant · Auditor</Pill>}
          bodyClassName="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <div>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-slate-800">Projected Collection</h4>
            </div>
            <div style={{ height: 180 }}>
              {projectionData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">Not enough live payment data to project future collection.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="projection" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={fmtCompact} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Projected']} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2.5} fill="url(#projection)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
              <p className="text-xs font-medium text-blue-700">Projection is based on the moving average of recent completed payments. No mock values are injected.</p>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-slate-800">Flagged Records</h4>
            </div>
            <div className="space-y-3">
              {flaggedProperties.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">No flagged compliance records yet.</div>
              ) : (
                flaggedProperties.map((property) => (
                  <div key={property.id} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                    <div className="flex-shrink-0 rounded-lg bg-amber-100 p-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-600" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-800">{property.id}</span>
                        <Pill tone="amber">{property.flag}</Pill>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">{property.owner} · {property.barangay}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-800">Assessed: {property.assessed}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SectionPanel>
      ) : (
        <SectionPanel title="Operational Intelligence" icon={Lock}>
          <div className="flex items-start gap-4 py-2">
            <div className="flex-shrink-0 rounded-xl bg-slate-100 p-3"><Lock className="h-5 w-5 text-slate-500" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Intelligence Locked</p>
              <p className="mt-1 text-sm text-slate-500">Staff accounts can still use the dashboard, but projected insights and flagged record panels are limited to Admin, Accountant, and Auditor roles.</p>
            </div>
          </div>
        </SectionPanel>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionPanel
          title="Deadlines & Alerts"
          icon={CalendarDays}
          badge={alerts.length > 0 ? <Pill tone="rose">{alerts.length} active</Pill> : undefined}
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          {alerts.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-400">No active alerts. New warnings will appear here once real data requires action.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <div key={alert.id} className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80 ${alert.type === 'critical' ? 'border-l-2 border-l-rose-500' : ''}`}>
                  <div className={`mt-0.5 flex-shrink-0 rounded-full p-2 ${alert.type === 'critical' ? 'bg-rose-100 text-rose-600' : alert.type === 'deadline' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    {alert.type === 'critical' ? <AlertTriangle className="h-4 w-4" /> : alert.type === 'deadline' ? <CalendarDays className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${alert.type === 'critical' ? 'text-rose-700' : 'text-slate-900'}`}>{alert.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{alert.desc}</p>
                  </div>
                  <Pill tone={alert.type === 'critical' ? 'rose' : alert.time === 'Today' ? 'blue' : 'slate'}>{alert.time}</Pill>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>

        <div className="space-y-6">
          <SectionPanel
            title="Recent Payments"
            icon={CreditCard}
            bodyClassName="p-0"
          >
            {recentPayments.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-400">No completed payments yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{payment.owner}</p>
                      <p className="text-xs text-slate-400">{payment.property} · {payment.date}</p>
                    </div>
                    <div className="ml-3 flex-shrink-0 text-right">
                      <p className="text-xs font-bold text-emerald-700">{formatCurrency(payment.amount)}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{payment.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>

          <SectionPanel title="Quick Actions" icon={ArrowRight} bodyClassName="space-y-2">
            {isAuditor ? (
              <>
                <button onClick={() => navigate('/app/audit')} className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50">
                  <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600"><ClipboardList className="h-3.5 w-3.5" /></div>
                  <span className="text-sm font-medium text-slate-700">View Audit Trail</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-amber-400" />
                </button>
                <button onClick={() => navigate('/app/reporting')} className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50">
                  <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600"><FileDown className="h-3.5 w-3.5" /></div>
                  <span className="text-sm font-medium text-slate-700">Open Reports</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-amber-400" />
                </button>
                <button onClick={() => navigate('/app/compliance')} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50">
                  <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600"><TrendingDown className="h-3.5 w-3.5" /></div>
                  <span className="text-sm font-medium text-slate-700">Review Delinquencies</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                </button>
              </>
            ) : (
              <>
                {canCreateProperty && (
                  <button onClick={() => navigate('/app/property-registration/manage')} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50">
                    <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600"><Home className="h-3.5 w-3.5" /></div>
                    <span className="text-sm font-medium text-slate-700">Register New Property</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                  </button>
                )}
                {canCreatePayment && (
                  <button onClick={() => navigate('/app/payment-management/manage')} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50">
                    <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600"><CreditCard className="h-3.5 w-3.5" /></div>
                    <span className="text-sm font-medium text-slate-700">Record Tax Payment</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                  </button>
                )}
                <button onClick={() => navigate('/app/tax-calculation')} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50">
                  <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600"><Building2 className="h-3.5 w-3.5" /></div>
                  <span className="text-sm font-medium text-slate-700">Review Tax Assessments</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                </button>
                {canViewReports && (
                  <button onClick={() => navigate('/app/reporting')} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50">
                    <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600"><CheckCircle2 className="h-3.5 w-3.5" /></div>
                    <span className="text-sm font-medium text-slate-700">Open Government Reports</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                  </button>
                )}
              </>
            )}
          </SectionPanel>
        </div>
      </div>
    </div>
  )
}
