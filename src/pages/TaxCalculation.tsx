import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  Clock3,
  Eye,
  FilterX,
  Landmark,
  Percent,
  Plus,
  ReceiptText,
  Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { useAuth } from '../context/AuthContext'
import { AccessDenied, ReadOnlyBanner } from '../components/RoleGuard'
import { apiJson } from '../lib/apiClient'
import { formatCurrency, formatDateOnly } from '../lib/liveData'
import type { ApiProperty, ApiTaxAssessment, ApiTaxRate } from '../lib/liveData'

type AssessmentRow = {
  id: string
  propertyId: string
  propertyType: string
  assessedValue: number
  taxRate: number
  basicTax: number
  sefTax: number
  penalties: number
  discounts: number
  totalAmount: number
  dueDate: string
  status: string
  taxYear: number
  quarter: string
  raw: ApiTaxAssessment
}

const ratePropertyTypes = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'MixedUse'] as const

const propertyTypeTone: Record<(typeof ratePropertyTypes)[number], SurfaceTone> = {
  Residential: 'blue',
  Commercial: 'emerald',
  Industrial: 'slate',
  Agricultural: 'amber',
  MixedUse: 'cyan',
}

const tableActionButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200'

const getAssessmentStatusTone = (status: string): SurfaceTone => {
  const normalized = status.trim().toLowerCase()

  if (normalized.includes('paid') || normalized.includes('settled') || normalized.includes('complete')) {
    return 'emerald'
  }

  if (normalized.includes('overdue') || normalized.includes('late') || normalized.includes('penalty')) {
    return 'rose'
  }

  if (normalized.includes('pending') || normalized.includes('review') || normalized.includes('due soon')) {
    return 'amber'
  }

  if (normalized.includes('draft') || normalized.includes('void') || normalized.includes('cancel')) {
    return 'slate'
  }

  return 'blue'
}

export default function TaxCalculation() {
  const navigate = useNavigate()
  const { can, user } = useAuth()

  if (!can('tax.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  const canCreate = can('tax.create')
  const canEdit = can('tax.edit')
  const canManage = canCreate || canEdit
  const isReadOnly = !canManage

  const [assessments, setAssessments] = useState<AssessmentRow[]>([])
  const [rates, setRates] = useState<ApiTaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState<'All' | string>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | string>('All')
  const [selected, setSelected] = useState<AssessmentRow | null>(null)

  useEffect(() => {
    const loadTaxData = async () => {
      setLoading(true)
      setError('')

      try {
        const [assessmentRecords, rateRecords, propertyRecords] = await Promise.all([
          apiJson<ApiTaxAssessment[]>('/TaxAssessments'),
          apiJson<ApiTaxRate[]>('/TaxRates'),
          apiJson<ApiProperty[]>('/Properties'),
        ])

        const propertyMap = new Map(propertyRecords.map((property) => [property.propertyId, property]))
        const mapped = assessmentRecords
          .map((assessment) => {
            const property = propertyMap.get(assessment.propertyId)

            return {
              id: `ASM-${String(assessment.assessmentId).padStart(4, '0')}`,
              propertyId: property?.propertyNumber?.trim() || `PROP-${assessment.propertyId}`,
              propertyType: property?.propertyType || 'Unknown',
              assessedValue: Number(assessment.assessedValue || 0),
              taxRate: Number(assessment.taxRate || 0),
              basicTax: Number(assessment.basicTax || 0),
              sefTax: Number(assessment.sefTax || 0),
              penalties: Number(assessment.penalties || 0),
              discounts: Number(assessment.discounts || 0),
              totalAmount: Number(assessment.totalAmount || 0),
              dueDate: formatDateOnly(assessment.dueDate),
              status: assessment.status || 'Unknown',
              taxYear: assessment.taxYear,
              quarter: assessment.quarter ? `Q${assessment.quarter}` : 'Annual',
              raw: assessment,
            }
          })
          .sort((left, right) => right.taxYear - left.taxYear || right.raw.assessmentId - left.raw.assessmentId)

        setAssessments(mapped)
        setRates(rateRecords)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load tax data.')
      } finally {
        setLoading(false)
      }
    }

    loadTaxData()
  }, [])

  const filtered = useMemo(() => {
    return assessments.filter((assessment) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        assessment.id.toLowerCase().includes(query) ||
        assessment.propertyId.toLowerCase().includes(query) ||
        assessment.propertyType.toLowerCase().includes(query)
      const matchesYear = yearFilter === 'All' || String(assessment.taxYear) === yearFilter
      const matchesStatus = statusFilter === 'All' || assessment.status === statusFilter
      return matchesSearch && matchesYear && matchesStatus
    })
  }, [assessments, search, statusFilter, yearFilter])

  const totals = useMemo(() => {
    const overdue = assessments.filter((assessment) => assessment.status.toLowerCase() === 'overdue').length
    const paid = assessments.filter((assessment) => assessment.status.toLowerCase() === 'paid').length
    const totalDue = assessments.reduce((sum, assessment) => sum + assessment.totalAmount, 0)
    const avgRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + Number(rate.ratePercentage || 0), 0) / rates.length : 0

    return { overdue, paid, totalDue, avgRate }
  }, [assessments, rates])

  const years = useMemo(
    () => Array.from(new Set(assessments.map((assessment) => String(assessment.taxYear)))).sort((left, right) => Number(right) - Number(left)),
    [assessments],
  )

  const statusOptions = useMemo(
    () => Array.from(new Set(assessments.map((assessment) => assessment.status))).sort((left, right) => left.localeCompare(right)),
    [assessments],
  )

  const hasFilters = search.trim().length > 0 || yearFilter !== 'All' || statusFilter !== 'All'

  const openManager = () => navigate('/app/tax-calculation/manage')

  const resetFilters = () => {
    setSearch('')
    setYearFilter('All')
    setStatusFilter('All')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      <WorkspaceHero
        eyebrow="Tax Calculation"
        title="Assessment and rate data arranged for faster review."
        description="Track active tax assessments, filter by year or status, and open the dedicated workspace only when you need to maintain records or rates."
        actions={
          canManage ? (
            <ActionButton icon={canCreate ? Plus : Percent} variant="primary" onClick={openManager}>
              Open Tax Workspace
            </ActionButton>
          ) : undefined
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">{loading ? 'Loading assessments' : `${assessments.length} live assessments`}</Pill>
            <Pill tone="cyan">{loading ? 'Loading rates' : `${rates.length} rate bands configured`}</Pill>
            <Pill tone={isReadOnly ? 'amber' : 'emerald'}>{isReadOnly ? 'Read-only mode' : 'Workspace actions enabled'}</Pill>
          </div>
        }
      />

      {isReadOnly && (
        <ReadOnlyBanner
          message={`Read-Only Mode — ${user?.role} accounts can inspect live tax assessments and rates here, while any adjustments stay inside the full tax workspace.`}
        />
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Unable to load tax data</p>
            <p className="mt-1 text-xs leading-5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Tax Due"
          value={loading ? '—' : formatCurrency(totals.totalDue)}
          hint="Combined payable amount across all loaded assessments."
          icon={Landmark}
          tone="blue"
        />
        <StatCard
          label="Paid Assessments"
          value={loading ? '—' : totals.paid}
          hint="Assessments already settled according to the latest status value."
          icon={ReceiptText}
          tone="emerald"
        />
        <StatCard
          label="Overdue Assessments"
          value={loading ? '—' : totals.overdue}
          hint="Records that may require follow-up, penalties, or updated collection action."
          icon={Clock3}
          tone="rose"
        />
        <StatCard
          label="Average Rate"
          value={loading ? '—' : `${totals.avgRate.toFixed(2)}%`}
          hint="Average of all configured tax rates currently returned by the API."
          icon={Calculator}
          tone="cyan"
        />
      </div>

      <SectionPanel
        title="Assessment Ledger"
        description="Filter the live assessment ledger by search term, tax year, and payment status."
        icon={Calculator}
        badge={<Pill tone="slate">{loading ? 'Loading' : `${filtered.length} shown`}</Pill>}
        actions={
          hasFilters ? (
            <ActionButton icon={FilterX} variant="ghost" onClick={resetFilters}>
              Reset filters
            </ActionButton>
          ) : undefined
        }
        bodyClassName="space-y-5"
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_220px]">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assessment ID, property number, or property type"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${surfaceInputClassName} pl-11`}
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tax Year</span>
            <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className={surfaceSelectClassName}>
              <option value="All">All tax years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={surfaceSelectClassName}>
              <option value="All">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Showing {loading ? '—' : filtered.length} of {assessments.length} assessments
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Inspect dues and statuses here, then open the full workspace if you need to maintain assessments or rates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {search.trim() && <Pill tone="blue">Query: {search.trim().slice(0, 24)}</Pill>}
              {yearFilter !== 'All' && <Pill tone="cyan">Tax year: {yearFilter}</Pill>}
              {statusFilter !== 'All' && <Pill tone={getAssessmentStatusTone(statusFilter)}>{statusFilter}</Pill>}
              {!hasFilters && <Pill tone="slate">No active filters</Pill>}
            </div>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Loading assessments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No assessments match the current search and filter combination.
            </div>
          ) : (
            filtered.map((assessment) => (
              <article key={assessment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="slate">{assessment.id}</Pill>
                      <Pill tone={propertyTypeTone[assessment.propertyType as (typeof ratePropertyTypes)[number]] ?? 'cyan'}>
                        {assessment.propertyType}
                      </Pill>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">{assessment.propertyId}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {assessment.taxYear} • {assessment.quarter} • Due {assessment.dueDate}
                    </p>
                  </div>
                  <Pill tone={getAssessmentStatusTone(assessment.status)}>{assessment.status}</Pill>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Assessed Value</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(assessment.assessedValue)}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Tax Rate</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">{assessment.taxRate.toFixed(2)}%</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Basic + SEF</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {formatCurrency(assessment.basicTax + assessment.sefTax)}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total Due</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(assessment.totalAmount)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton icon={Eye} onClick={() => setSelected(assessment)} fluidOnMobile={false}>
                    View details
                  </ActionButton>
                  {canManage && (
                    <ActionButton icon={ArrowUpRight} variant="secondary" onClick={openManager} fluidOnMobile={false}>
                      Open workspace
                    </ActionButton>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Assessment</th>
                  <th className="px-5 py-3.5">Property</th>
                  <th className="px-5 py-3.5 text-right">Assessed Value</th>
                  <th className="px-5 py-3.5 text-right">Tax Rate</th>
                  <th className="px-5 py-3.5 text-right">Total Due</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                      Loading assessments...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                      No assessments match the current search and filter combination.
                    </td>
                  </tr>
                ) : (
                  filtered.map((assessment) => (
                    <tr key={assessment.id} className="align-top transition-colors hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-slate-950">{assessment.id}</p>
                          <p className="text-xs text-slate-500">
                            {assessment.taxYear} • {assessment.quarter}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-slate-950">{assessment.propertyId}</p>
                          <p className="text-xs text-slate-500">{assessment.propertyType}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-slate-700">{formatCurrency(assessment.assessedValue)}</td>
                      <td className="px-5 py-4 text-right text-sm text-slate-700">{assessment.taxRate.toFixed(2)}%</td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-slate-950">
                        {formatCurrency(assessment.totalAmount)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{assessment.dueDate}</td>
                      <td className="px-5 py-4">
                        <Pill tone={getAssessmentStatusTone(assessment.status)}>{assessment.status}</Pill>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            icon={Eye}
                            variant="secondary"
                            className={`${tableActionButtonClass} text-sky-700 hover:border-sky-200 hover:bg-sky-50`}
                            onClick={() => setSelected(assessment)}
                            fluidOnMobile={false}
                            aria-label={`View details for ${assessment.id}`}
                            title={`View details for ${assessment.id}`}
                          />
                          {canManage && (
                            <ActionButton
                              icon={ArrowUpRight}
                              variant="secondary"
                              className={`${tableActionButtonClass} hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900`}
                              onClick={openManager}
                              fluidOnMobile={false}
                              aria-label={`Open workspace for ${assessment.id}`}
                              title={`Open workspace for ${assessment.id}`}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Current Tax Rates"
        description="Rates currently available to the assessment workflow across property classifications."
        icon={Percent}
        badge={<Pill tone="slate">{loading ? 'Loading' : `${rates.length} configured`}</Pill>}
        bodyClassName="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {ratePropertyTypes.map((propertyType) => {
            const rate = rates.find((item) => item.propertyType === propertyType)

            return (
              <div key={propertyType} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <Pill tone={propertyTypeTone[propertyType]}>{propertyType}</Pill>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {rate ? 'Active' : 'Missing'}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  {rate ? `${Number(rate.ratePercentage).toFixed(2)}%` : '—'}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {rate ? `Effective ${formatDateOnly(rate.effectiveFrom)}` : 'No rate has been configured for this property type yet.'}
                </p>
              </div>
            )
          })}
        </div>
      </SectionPanel>

      {selected && (
        <DetailDialog
          title="Assessment Details"
          subtitle={`${selected.id} • ${selected.propertyId}`}
          badge={<Pill tone={getAssessmentStatusTone(selected.status)}>{selected.status}</Pill>}
          onClose={() => setSelected(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setSelected(null)}>
                Close
              </ActionButton>
              {canManage && (
                <ActionButton icon={ArrowUpRight} variant="primary" onClick={openManager}>
                  Open Tax Workspace
                </ActionButton>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Assessed Value</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(selected.assessedValue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Tax Rate</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{selected.taxRate.toFixed(2)}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total Due</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(selected.totalAmount)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Assessment snapshot</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{selected.propertyType}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {selected.taxYear} • {selected.quarter} • Due {selected.dueDate}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 px-4 py-1 sm:px-5">
              <DetailRow label="Property" value={selected.propertyId} emphasize />
              <DetailRow label="Basic Tax" value={formatCurrency(selected.basicTax)} />
              <DetailRow label="SEF Tax" value={formatCurrency(selected.sefTax)} />
              <DetailRow label="Penalties" value={formatCurrency(selected.penalties)} />
              <DetailRow label="Discounts" value={formatCurrency(selected.discounts)} />
              <DetailRow label="Status" value={selected.status} />
              <DetailRow label="Database Record" value={`#${selected.raw.assessmentId}`} />
              {selected.raw.notes?.trim() && <DetailRow label="Notes" value={selected.raw.notes.trim()} />}
            </div>
          </div>
        </DetailDialog>
      )}
    </div>
  )
}
