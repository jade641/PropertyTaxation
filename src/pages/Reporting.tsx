import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Download,
  Eye,
  FileCheck,
  FileText,
  Lock,
  MapPin,
  Printer,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AccessDenied, ReadOnlyBanner } from '../components/RoleGuard'
import {
  ActionButton,
  DetailDialog,
  DetailRow,
  Pill,
  SectionPanel,
  StatCard,
  WorkspaceHero,
} from '../components/recordWorkspace'
import type { SurfaceTone } from '../components/recordWorkspace'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import api from '../api'
import { apiJson } from '../lib/apiClient'
import {
  buildBarangayMap,
  formatDateOnly,
  formatCurrency,
  groupPaymentsByAssessment,
  reportTypeLabel,
  reportTypeToTab,
} from '../lib/liveData'
import type {
  ApiBarangay,
  ApiPayment,
  ApiProperty,
  ApiReportRecord,
  ApiTaxAssessment,
} from '../lib/liveData'

type ReportType = 'barangay' | 'monthly' | 'annual' | 'delinquency'
type ReportStatus = 'Draft' | 'For Review' | 'Approved' | 'Published'

type ReportItem = {
  id: string
  recordId: number
  name: string
  type: ReportType
  period: string
  status: ReportStatus
  dateGenerated: string
  totalProperties: number
  totalAssessed: number
  totalTaxDue: number
  totalCollected: number
  raw: ApiReportRecord
}

type ToastState = {
  message: string
  type: 'success' | 'error'
}

const fmt = (value: number) => formatCurrency(value)
const fmtCompact = (value: number) => {
  if (value >= 1000000) return `₱${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `₱${(value / 1000).toFixed(0)}K`
  return `₱${value.toFixed(0)}`
}

const toReportStatus = (status: string): ReportStatus => {
  switch (status) {
    case 'ForReview':
      return 'For Review'
    case 'Approved':
      return 'Approved'
    case 'Published':
      return 'Published'
    default:
      return 'Draft'
  }
}

const toApiStatus = (status: ReportStatus) => {
  switch (status) {
    case 'For Review':
      return 'ForReview'
    default:
      return status
  }
}

const buildPeriodLabel = (record: ApiReportRecord) => {
  const start = formatDateOnly(record.periodStart)
  const end = formatDateOnly(record.periodEnd)
  if (start === end) return start
  return `${start} - ${end}`
}

const downloadCsv = (report: ReportItem) => {
  const rows = [
    ['Field', 'Value'],
    ['Report Code', report.id],
    ['Report Name', report.name],
    ['Report Type', reportTypeLabel(report.raw.reportType)],
    ['Period', report.period],
    ['Status', report.status],
    ['Date Generated', report.dateGenerated],
    ['Total Properties', report.totalProperties],
    ['Total Assessed Value', report.totalAssessed],
    ['Total Tax Due', report.totalTaxDue],
    ['Total Collected', report.totalCollected],
  ]
  const content = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${report.id}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const reportStatusTone = (status: ReportStatus): SurfaceTone => {
  switch (status) {
    case 'Published': return 'emerald'
    case 'For Review': return 'amber'
    case 'Approved': return 'blue'
    default: return 'slate'
  }
}

const tableActionButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200'

export default function Reporting() {
  const { can, user } = useAuth()

  if (!can('reporting.view')) {
    return <AccessDenied requiredRole="Accountant, Admin, or Auditor" />
  }

  const canGenerate = can('reporting.generate')
  const canSubmit = can('reporting.submit')
  const canExport = can('reporting.export')
  const isReadOnly = !canGenerate && !canSubmit

  const [reports, setReports] = useState<ReportItem[]>([])
  const [barangayData, setBarangayData] = useState<Array<{ name: string; collected: number; due: number }>>([])
  const [payments, setPayments] = useState<ApiPayment[]>([])
  const [assessments, setAssessments] = useState<ApiTaxAssessment[]>([])
  const [properties, setProperties] = useState<ApiProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | ReportType>('all')
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null)
  const [generating, setGenerating] = useState(false)
  const [highlightedReport, setHighlightedReport] = useState<string | null>(null)
  const reportTableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const loadReports = async () => {
    setLoading(true)
    setError('')

    try {
      const [reportRecords, paymentRecords, assessmentRecords, propertyRecords, barangays] = await Promise.all([
        apiJson<ApiReportRecord[]>('/ReportRecords'),
        apiJson<ApiPayment[]>('/Payments'),
        apiJson<ApiTaxAssessment[]>('/TaxAssessments'),
        apiJson<ApiProperty[]>('/Properties'),
        apiJson<ApiBarangay[]>('/Barangays'),
      ])

      setPayments(paymentRecords)
      setAssessments(assessmentRecords)
      setProperties(propertyRecords)

      const mappedReports: ReportItem[] = reportRecords
        .map((record: ApiReportRecord) => ({
          id: record.reportCode,
          recordId: record.reportRecordId,
          name: record.reportName,
          type: reportTypeToTab(record.reportType) as ReportType,
          period: buildPeriodLabel(record),
          status: toReportStatus(record.status),
          dateGenerated: formatDateOnly(record.generatedAt),
          totalProperties: Number(record.totalProperties || 0),
          totalAssessed: Number(record.totalAssessedValue || 0),
          totalTaxDue: Number(record.totalTaxDue || 0),
          totalCollected: Number(record.totalCollected || 0),
          raw: record,
        }))
        .sort((left: ReportItem, right: ReportItem) => {
          const leftTime = new Date(left.raw.generatedAt ?? left.raw.updatedAt ?? 0).getTime()
          const rightTime = new Date(right.raw.generatedAt ?? right.raw.updatedAt ?? 0).getTime()
          return rightTime - leftTime
        })

      setReports(mappedReports)

      const barangayMap = buildBarangayMap(barangays)
      const propertyMap = new Map<number, ApiProperty>(propertyRecords.map((property: ApiProperty) => [property.propertyId, property]))
      const collectedByAssessment = groupPaymentsByAssessment(paymentRecords)
      const chartByBarangay = new Map<string, { due: number; collected: number }>()

      assessmentRecords.forEach((assessment: ApiTaxAssessment) => {
        const property = propertyMap.get(assessment.propertyId)
        if (!property) return
        const barangayName = barangayMap.get(property.barangayId)?.barangayName ?? 'Unknown Barangay'
        const current = chartByBarangay.get(barangayName) ?? { due: 0, collected: 0 }
        current.due += Number(assessment.totalAmount || 0)
        current.collected += Number(collectedByAssessment.get(assessment.assessmentId) ?? 0)
        chartByBarangay.set(barangayName, current)
      })

      setBarangayData(
        Array.from(chartByBarangay.entries())
          .map(([name, totals]) => ({ name, due: totals.due, collected: totals.collected }))
          .sort((left, right) => right.due - left.due)
          .slice(0, 8),
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reporting data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const filtered = useMemo(() => {
    return reports.filter((report) => activeTab === 'all' || report.type === activeTab)
  }, [activeTab, reports])

  const summary = useMemo(() => {
    return {
      draft: reports.filter((report) => report.status === 'Draft').length,
      forReview: reports.filter((report) => report.status === 'For Review').length,
      published: reports.filter((report) => report.status === 'Published').length,
      total: reports.length,
    }
  }, [reports])

  const totalAssessed = useMemo(
    () => assessments.reduce((sum, assessment) => sum + Number(assessment.assessedValue || 0), 0),
    [assessments],
  )

  const totalCollected = useMemo(
    () => payments.filter((payment) => payment.status === 'Completed').reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0),
    [payments],
  )

  const totalTaxDue = useMemo(
    () => assessments.reduce((sum, assessment) => sum + Number(assessment.totalAmount || 0), 0),
    [assessments],
  )

  const nextAnnualReport = useMemo(() => reports.find((report) => report.type === 'annual'), [reports])

  const handleGenerate = async () => {
    if (!canGenerate) return
    if (properties.length === 0 || assessments.length === 0) {
      setToast({ message: 'Add properties and tax assessments first before generating a report.', type: 'error' })
      return
    }

    const currentYear = assessments.reduce((latestYear, assessment) => Math.max(latestYear, assessment.taxYear), new Date().getFullYear())
    const annualCount = reports.filter((report) => report.type === 'annual').length + 1
    const payload = {
      reportCode: `RPT-${currentYear}-${String(annualCount).padStart(3, '0')}`,
      reportName: `Annual Real Property Tax Summary ${currentYear}`,
      reportType: 'AnnualSummary',
      periodStart: `${currentYear}-01-01T00:00:00`,
      periodEnd: `${currentYear}-12-31T23:59:59`,
      status: 'Draft',
      totalProperties: properties.length,
      totalAssessedValue: totalAssessed,
      totalTaxDue,
      totalCollected,
      filePath: null,
      generatedBy: Number(user?.id ?? 0),
      approvedBy: null,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setGenerating(true)
    try {
      const response = await api.post<ApiReportRecord>('/ReportRecords', payload)
      await loadReports()
      setHighlightedReport(response.data.reportCode)
      setActiveTab('annual')
      setToast({ message: `Report ${response.data.reportCode} generated.`, type: 'success' })
      setTimeout(() => {
        reportTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : 'Unable to generate report.'
      setToast({ message, type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  const updateReportStatus = async (report: ReportItem, status: ReportStatus) => {
    try {
      const payload = {
        ...report.raw,
        status: toApiStatus(status),
      }
      await api.put(`/ReportRecords/${report.recordId}`, payload)
      await loadReports()
      setPreviewReport((current) => (current?.recordId === report.recordId ? { ...current, status } : current))
      setToast({ message: `${report.id} updated to ${status}.`, type: 'success' })
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Unable to update report status.'
      setToast({ message, type: 'error' })
    }
  }

  const handleViewAnnualReport = () => {
    if (!nextAnnualReport) return
    setActiveTab('annual')
    setHighlightedReport(nextAnnualReport.id)
    setTimeout(() => {
      reportTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      {toast && (
        <div className={`fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          {toast.type === 'success' ? <FileCheck className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-rose-500" />}
          {toast.message}
        </div>
      )}

      <WorkspaceHero
        eyebrow="Government Reporting"
        title="Generate, review, and export official Davao Region LGU property tax reports."
        description="Reports are built from live system data including tax assessments, payments, and property records. Accountants can generate and publish; Auditors can view and export only."
        actions={
          <div className="flex flex-wrap gap-2">
            {canGenerate ? (
              <ActionButton
                icon={RefreshCw}
                variant="primary"
                onClick={handleGenerate}
                disabled={generating}
                className={generating ? 'opacity-75 cursor-wait' : ''}
              >
                {generating ? 'Generating...' : 'Generate New Report'}
              </ActionButton>
            ) : (
              <ActionButton icon={RefreshCw} variant="primary" disabled>
                Generate New Report
              </ActionButton>
            )}
          </div>
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">{loading ? 'Loading' : `${reports.length} total reports`}</Pill>
            <Pill tone="slate">{loading ? '—' : `${summary.draft} draft`}</Pill>
            <Pill tone="amber">{loading ? '—' : `${summary.forReview} for review`}</Pill>
            <Pill tone="emerald">{loading ? '—' : `${summary.published} published`}</Pill>
          </div>
        }
      />

      {isReadOnly && (
        <ReadOnlyBanner message={`Read-Only Mode — ${user?.role} accounts can view and export reports but cannot generate or publish new filings.`} />
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Unable to load reporting data</p>
            <p className="mt-1 text-xs leading-5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Draft Reports"
          value={loading ? '—' : summary.draft}
          hint="Reports created but not yet submitted for review."
          icon={FileText}
          tone="slate"
        />
        <StatCard
          label="For Review"
          value={loading ? '—' : summary.forReview}
          hint="Reports submitted and awaiting approval."
          icon={Eye}
          tone="amber"
        />
        <StatCard
          label="Published"
          value={loading ? '—' : summary.published}
          hint="Reports approved and officially published."
          icon={FileCheck}
          tone="emerald"
        />
        <div className="flex flex-col gap-2">
          <StatCard
            label="Latest Annual Report"
            value={nextAnnualReport?.dateGenerated ?? 'None yet'}
            hint={nextAnnualReport?.name ?? 'Generate a report when live assessments exist.'}
            icon={TrendingUp}
            tone="blue"
          />
          {nextAnnualReport && (
            <button onClick={handleViewAnnualReport} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
              View Annual Report ↓
            </button>
          )}
        </div>
      </div>

      <SectionPanel
        title="Collection by Barangay"
        description="Tax due vs. collected amounts per barangay based on live assessment and payment records."
        icon={MapPin}
        bodyClassName="pt-2"
      >
        <div style={{ height: 240 }}>
          {barangayData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">No collection data available yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barangayData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={fmtCompact} />
                <Tooltip formatter={(value: number) => [fmt(value)]} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="due" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} name="Tax Due" />
                <Bar dataKey="collected" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={24} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Report Registry"
        description="All generated reports filtered by type. Click Preview to see full breakdown, or Export to download CSV."
        icon={FileText}
        badge={<Pill tone="slate">{loading ? 'Loading' : `${filtered.length} shown`}</Pill>}
        bodyClassName="space-y-0 overflow-hidden p-0"
        actions={
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
            {([
              { key: 'all', label: 'All' },
              { key: 'barangay', label: 'Barangay' },
              { key: 'monthly', label: 'Monthly' },
              { key: 'annual', label: 'Annual' },
              { key: 'delinquency', label: 'Delinquency' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <div ref={reportTableRef} className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Report</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Period</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Tax Due</th>
                <th className="px-5 py-3.5 text-right">Collected</th>
                <th className="px-5 py-3.5">Generated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">Loading reports...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">No reports found for this filter.</td></tr>
              ) : (
                filtered.map((report) => (
                  <tr key={report.id} className={`align-top transition-colors hover:bg-slate-50/80 ${highlightedReport === report.id ? 'ring-2 ring-inset ring-amber-400 bg-amber-50/40' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 rounded-lg bg-sky-50 p-1.5"><FileText className="h-4 w-4 text-sky-600" /></div>
                        <div>
                          <p className="max-w-[200px] truncate text-sm font-medium text-slate-900" title={report.name}>{report.name}</p>
                          <p className="text-xs text-slate-500">{report.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Pill tone="blue">{reportTypeLabel(report.raw.reportType)}</Pill>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{report.period}</td>
                    <td className="px-5 py-4">
                      <Pill tone={reportStatusTone(report.status)}>{report.status}</Pill>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-slate-700">{fmt(report.totalTaxDue)}</td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-sm font-semibold text-slate-950">{fmt(report.totalCollected)}</p>
                      {report.totalTaxDue > 0 && <p className="text-xs text-emerald-600">{Math.round((report.totalCollected / report.totalTaxDue) * 100)}%</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{report.dateGenerated}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          icon={Eye}
                          variant="secondary"
                          className={`${tableActionButtonClass} text-sky-700 hover:border-sky-200 hover:bg-sky-50`}
                          onClick={() => setPreviewReport(report)}
                          fluidOnMobile={false}
                          title="Preview"
                        />
                        {canExport && (
                          <ActionButton
                            icon={Download}
                            variant="secondary"
                            className={`${tableActionButtonClass} text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50`}
                            onClick={() => downloadCsv(report)}
                            fluidOnMobile={false}
                            title="Export CSV"
                          />
                        )}
                        {canSubmit && report.status === 'Draft' && (
                          <ActionButton
                            variant="primary"
                            className="h-10 px-3 text-xs"
                            onClick={() => updateReportStatus(report, 'For Review')}
                            fluidOnMobile={false}
                          >
                            Submit
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {isReadOnly && (
          <div className="flex items-center gap-2 border-t border-amber-100 bg-amber-50/50 px-5 py-2.5 text-xs text-amber-700">
            <Eye className="h-3.5 w-3.5 flex-shrink-0" />
            View and export access only. Generating and submitting reports requires Accountant or Admin access.
          </div>
        )}
      </SectionPanel>

      {previewReport && (
        <DetailDialog
          title="Report Preview"
          subtitle={`${previewReport.id} · ${previewReport.period}`}
          badge={<Pill tone={reportStatusTone(previewReport.status)}>{previewReport.status}</Pill>}
          onClose={() => setPreviewReport(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setPreviewReport(null)}>Close</ActionButton>
              <ActionButton icon={Printer} variant="secondary" onClick={() => window.print()}>Print</ActionButton>
              {canExport && (
                <ActionButton icon={Download} variant="primary" onClick={() => downloadCsv(previewReport)}>Export CSV</ActionButton>
              )}
              {previewReport.status === 'Draft' && canSubmit && (
                <ActionButton icon={TrendingUp} variant="primary" onClick={() => updateReportStatus(previewReport, 'Published')}>
                  Approve & Publish
                </ActionButton>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Republic of the Philippines · Davao Region LGUs</p>
              <p className="text-sm font-bold text-slate-950 mt-1">{previewReport.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{previewReport.period}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-1 sm:px-5">
              <DetailRow label="Report ID" value={previewReport.id} />
              <DetailRow label="Report Type" value={reportTypeLabel(previewReport.raw.reportType)} />
              <DetailRow label="Period Covered" value={previewReport.period} />
              <DetailRow label="Date Generated" value={previewReport.dateGenerated} />
              <DetailRow label="Status" value={previewReport.status} emphasize />
              <DetailRow label="Total Properties" value={previewReport.totalProperties.toLocaleString()} />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Description</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="px-4 py-3 text-slate-700">Total Assessed Value</td><td className="px-4 py-3 text-right font-medium text-slate-900">{fmt(previewReport.totalAssessed)}</td></tr>
                  <tr><td className="px-4 py-3 text-slate-700">Total Tax Due (Basic RPT + SEF)</td><td className="px-4 py-3 text-right font-medium text-slate-900">{fmt(previewReport.totalTaxDue)}</td></tr>
                  <tr><td className="px-4 py-3 text-slate-700">Total Collected</td><td className="px-4 py-3 text-right font-medium text-emerald-700">{fmt(previewReport.totalCollected)}</td></tr>
                  <tr><td className="px-4 py-3 text-slate-700">Uncollected Balance</td><td className="px-4 py-3 text-right font-medium text-rose-600">{fmt(previewReport.totalTaxDue - previewReport.totalCollected)}</td></tr>
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-950">Collection Efficiency</td>
                    <td className="px-4 py-3 text-right font-black text-sky-700">{previewReport.totalTaxDue > 0 ? Math.round((previewReport.totalCollected / previewReport.totalTaxDue) * 100) : 0}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {previewReport.status === 'Draft' && !canSubmit && (
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" /> Approval requires Accountant or Admin access.
              </p>
            )}
          </div>
        </DetailDialog>
      )}
    </div>
  )
}
