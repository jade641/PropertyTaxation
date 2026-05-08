import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Eye,
  FilterX,
  Plus,
  Receipt,
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
import type { ApiPayment, ApiProperty, ApiTaxAssessment } from '../lib/liveData'

type PaymentRow = {
  id: string
  paymentId: number
  receiptNumber: string
  propertyId: string
  owner: string
  amountDue: number
  amountPaid: number
  dueDate: string
  paymentDate: string
  status: string
  method: string
  taxYear: number
  raw: ApiPayment
}

const tableActionButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200'

const paymentStatusTone = (status: string): SurfaceTone => {
  const s = status.toLowerCase()
  if (s === 'completed') return 'emerald'
  if (s === 'pending') return 'amber'
  if (s === 'failed') return 'rose'
  return 'slate'
}

export default function PaymentManagement() {
  const navigate = useNavigate()
  const { can, user } = useAuth()

  if (!can('payment.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  const canCreate = can('payment.create')
  const canEdit = can('payment.edit')
  const isReadOnly = !canCreate && !canEdit

  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | string>('All')
  const [selected, setSelected] = useState<PaymentRow | null>(null)

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true)
      setError('')
      try {
        const [paymentRecords, assessmentRecords, propertyRecords] = await Promise.all([
          apiJson<ApiPayment[]>('/Payments'),
          apiJson<ApiTaxAssessment[]>('/TaxAssessments'),
          apiJson<ApiProperty[]>('/Properties'),
        ])

        const assessmentMap = new Map(assessmentRecords.map((assessment) => [assessment.assessmentId, assessment]))
        const propertyMap = new Map(propertyRecords.map((property) => [property.propertyId, property]))

        const mapped = paymentRecords
          .map((payment) => {
            const assessment = assessmentMap.get(payment.assessmentId)
            const property = assessment ? propertyMap.get(assessment.propertyId) : undefined
            return {
              id: payment.paymentReference || `PAY-${String(payment.paymentId).padStart(4, '0')}`,
              paymentId: payment.paymentId,
              receiptNumber: payment.receiptNumber || '—',
              propertyId: property?.propertyNumber || `PROP-${assessment?.propertyId ?? '—'}`,
              owner: property ? `Owner #${property.ownerId}` : `Payer #${payment.payerId}`,
              amountDue: Number(assessment?.totalAmount ?? 0),
              amountPaid: Number(payment.amountPaid || 0),
              dueDate: formatDateOnly(assessment?.dueDate),
              paymentDate: formatDateOnly(payment.paymentDate),
              status: payment.status,
              method: payment.paymentMethod || '—',
              taxYear: assessment?.taxYear ?? new Date().getFullYear(),
              raw: payment,
            }
          })
          .sort((left, right) => right.paymentId - left.paymentId)

        setPayments(mapped)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load payments.')
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [])

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        payment.id.toLowerCase().includes(query) ||
        payment.propertyId.toLowerCase().includes(query) ||
        payment.owner.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All' || payment.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [payments, search, statusFilter])

  const totals = useMemo(() => {
    const completed = payments.filter((payment) => payment.status === 'Completed')
    const pending = payments.filter((payment) => payment.status === 'Pending')
    return {
      totalCollected: completed.reduce((sum, payment) => sum + payment.amountPaid, 0),
      completedCount: completed.length,
      pendingCount: pending.length,
      receipts: payments.length,
    }
  }, [payments])

  const hasFilters = search.trim().length > 0 || statusFilter !== 'All'

  const statusOptions = useMemo(
    () => Array.from(new Set(payments.map((payment) => payment.status))).sort(),
    [payments],
  )

  const openManager = () => navigate('/app/payment-management/manage')

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      <WorkspaceHero
        eyebrow="Payment Management"
        title="Live payment ledger connected to assessments and receipts."
        description="Review collected payments, track pending transactions, and open the full workspace only when you need to record or update payment entries."
        actions={
          canCreate || canEdit ? (
            <ActionButton icon={canCreate ? Plus : Receipt} variant="primary" onClick={openManager}>
              Open Payment Workspace
            </ActionButton>
          ) : undefined
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">{loading ? 'Loading payments' : `${payments.length} live records`}</Pill>
            <Pill tone={isReadOnly ? 'amber' : 'emerald'}>{isReadOnly ? 'Read-only mode' : 'Workspace actions enabled'}</Pill>
            <Pill tone="slate">{loading ? 'Syncing filters' : `${filtered.length} match current filters`}</Pill>
          </div>
        }
      />

      {isReadOnly && (
        <ReadOnlyBanner
          message={`Read-Only Mode — ${user?.role} accounts can inspect live payment records here, while any create or edit work stays inside the full payment workspace.`}
        />
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Unable to load payment records</p>
            <p className="mt-1 text-xs leading-5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Collected Amount"
          value={loading ? '—' : formatCurrency(totals.totalCollected)}
          hint="Total amount received from completed payment transactions."
          icon={CircleDollarSign}
          tone="emerald"
        />
        <StatCard
          label="Completed Payments"
          value={loading ? '—' : totals.completedCount}
          hint="Payments that have been fully settled and marked as completed."
          icon={CheckCircle2}
          tone="blue"
        />
        <StatCard
          label="Pending Payments"
          value={loading ? '—' : totals.pendingCount}
          hint="Transactions awaiting confirmation, posting, or follow-up."
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Issued Receipts"
          value={loading ? '—' : totals.receipts}
          hint="Total payment records across all statuses in the live ledger."
          icon={Receipt}
          tone="cyan"
        />
      </div>

      <SectionPanel
        title="Payment Ledger"
        description="Search, filter, and inspect live payment rows without leaving the summary view."
        icon={CreditCard}
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
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px]">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search payment reference, property number, or owner"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${surfaceInputClassName} pl-11`}
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={surfaceSelectClassName}
            >
              <option value="All">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Showing {loading ? '—' : filtered.length} of {payments.length} payments
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use the workspace for write actions. This screen is optimized for scanning, filtering, and checking payment details.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {search.trim() && <Pill tone="blue">Query: {search.trim().slice(0, 24)}</Pill>}
              {statusFilter !== 'All' && <Pill tone={paymentStatusTone(statusFilter)}>{statusFilter}</Pill>}
              {!hasFilters && <Pill tone="slate">No active filters</Pill>}
            </div>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Loading payment records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No payments match the current search and filter combination.
            </div>
          ) : (
            filtered.map((payment) => (
              <article key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="slate">{payment.id}</Pill>
                      <Pill tone={paymentStatusTone(payment.status)}>{payment.status}</Pill>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">{payment.propertyId}</p>
                    <p className="mt-1 text-xs text-slate-500">{payment.owner} • {payment.method}</p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Amount Due</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(payment.amountDue)}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Amount Paid</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(payment.amountPaid)}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Receipt</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">{payment.receiptNumber}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Payment Date</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">{payment.paymentDate}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton icon={Eye} onClick={() => setSelected(payment)} fluidOnMobile={false}>
                    View details
                  </ActionButton>
                  {(canCreate || canEdit) && (
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
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Property</th>
                  <th className="px-5 py-3.5 text-right">Due</th>
                  <th className="px-5 py-3.5 text-right">Paid</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Payment Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                      Loading payment records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                      No payments match the current search and filter combination.
                    </td>
                  </tr>
                ) : (
                  filtered.map((payment) => (
                    <tr key={payment.id} className="align-top transition-colors hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-slate-950">{payment.id}</p>
                          <p className="text-xs text-slate-500">{payment.receiptNumber}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-900">{payment.propertyId}</p>
                        <p className="text-xs text-slate-500">{payment.owner}</p>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-slate-700">{formatCurrency(payment.amountDue)}</td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-slate-950">{formatCurrency(payment.amountPaid)}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{payment.method}</td>
                      <td className="px-5 py-4">
                        <Pill tone={paymentStatusTone(payment.status)}>{payment.status}</Pill>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{payment.paymentDate}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            icon={Eye}
                            variant="secondary"
                            className={`${tableActionButtonClass} text-sky-700 hover:border-sky-200 hover:bg-sky-50`}
                            onClick={() => setSelected(payment)}
                            fluidOnMobile={false}
                            aria-label={`View details for ${payment.id}`}
                            title={`View details for ${payment.id}`}
                          />
                          {(canCreate || canEdit) && (
                            <ActionButton
                              icon={ArrowUpRight}
                              variant="secondary"
                              className={`${tableActionButtonClass} hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900`}
                              onClick={openManager}
                              fluidOnMobile={false}
                              aria-label="Open workspace"
                              title="Open workspace"
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

      {selected && (
        <DetailDialog
          title="Payment Details"
          subtitle={`${selected.id} • ${selected.propertyId}`}
          badge={<Pill tone={paymentStatusTone(selected.status)}>{selected.status}</Pill>}
          onClose={() => setSelected(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setSelected(null)}>
                Close
              </ActionButton>
              {(canCreate || canEdit) && (
                <ActionButton icon={ArrowUpRight} variant="primary" onClick={openManager}>
                  Open Payment Workspace
                </ActionButton>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Amount Due</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(selected.amountDue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Amount Paid</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(selected.amountPaid)}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-1 sm:px-5">
              <DetailRow label="Receipt Number" value={selected.receiptNumber} />
              <DetailRow label="Property ID" value={selected.propertyId} />
              <DetailRow label="Owner" value={selected.owner} />
              <DetailRow label="Tax Year" value={selected.taxYear} />
              <DetailRow label="Due Date" value={selected.dueDate} />
              <DetailRow label="Payment Date" value={selected.paymentDate} />
              <DetailRow label="Payment Method" value={selected.method} />
              <DetailRow label="Status" value={selected.status} emphasize />
            </div>
          </div>
        </DetailDialog>
      )}
    </div>
  )
}
