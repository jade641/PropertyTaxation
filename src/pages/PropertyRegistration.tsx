import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Edit3,
  Eye,
  FilterX,
  Home,
  Landmark,
  Layers3,
  MapPin,
  Plus,
  Search,
  Trees,
  Warehouse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
import type { ApiProperty } from '../lib/liveData'

type PropertyType = 'Residential' | 'Commercial' | 'Industrial' | 'Agricultural' | 'MixedUse' | 'Other'
type PropertyStatus = 'Active' | 'Inactive' | 'Pending' | 'Archived' | 'Unknown'

type PropertyItem = {
  id: string
  propertyId: number
  owner: string
  propertyType: PropertyType
  titleNumber: string
  address: string
  areaSqm: number
  marketValue: number
  assessedValue: number
  status: PropertyStatus
  dateRegistered: string
  raw: ApiProperty
}

const propertyTypeOrder: PropertyType[] = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'MixedUse', 'Other']
const propertyStatusOrder: PropertyStatus[] = ['Active', 'Pending', 'Inactive', 'Archived', 'Unknown']

const typeMeta: Record<PropertyType, { tone: SurfaceTone; icon: LucideIcon; label: string }> = {
  Residential: { tone: 'blue', icon: Home, label: 'Residential' },
  Commercial: { tone: 'emerald', icon: Building2, label: 'Commercial' },
  Industrial: { tone: 'slate', icon: Warehouse, label: 'Industrial' },
  Agricultural: { tone: 'amber', icon: Trees, label: 'Agricultural' },
  MixedUse: { tone: 'cyan', icon: Layers3, label: 'Mixed Use' },
  Other: { tone: 'slate', icon: Layers3, label: 'Other' },
}

const statusTone: Record<PropertyStatus, SurfaceTone> = {
  Active: 'emerald',
  Pending: 'amber',
  Inactive: 'slate',
  Archived: 'rose',
  Unknown: 'slate',
}

const tableActionButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200'

const normalizePropertyType = (value?: string | null): PropertyType => {
  const match = propertyTypeOrder.find((type) => type === value)
  return match ?? 'Other'
}

const normalizePropertyStatus = (value?: string | null): PropertyStatus => {
  const match = propertyStatusOrder.find((status) => status === value)
  return match ?? 'Unknown'
}

export default function PropertyRegistration() {
  const navigate = useNavigate()
  const { can, user } = useAuth()

  if (!can('property.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  const canCreate = can('property.create')
  const canEdit = can('property.edit')
  const canDelete = can('property.delete')
  const canManage = canCreate || canEdit || canDelete
  const isReadOnly = !canManage

  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'All' | PropertyType>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | PropertyStatus>('All')
  const [selected, setSelected] = useState<PropertyItem | null>(null)

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true)
      setError('')

      try {
        const propertyRecords = await apiJson<ApiProperty[]>('/Properties')
        const mapped = propertyRecords
          .map((property) => {
            const propertyType = normalizePropertyType(property.propertyType)
            const status = normalizePropertyStatus(property.status)

            return {
              id: property.propertyNumber?.trim() || `PROP-${String(property.propertyId).padStart(4, '0')}`,
              propertyId: property.propertyId,
              owner: `Owner ID ${property.ownerId}`,
              propertyType,
              titleNumber: property.titleNumber?.trim() || 'No title on file',
              address: [property.addressLine1, property.addressLine2].filter(Boolean).join(', '),
              areaSqm: Number(property.lotArea ?? property.floorArea ?? 0),
              marketValue: Number(property.marketValue ?? 0),
              assessedValue: Number(property.assessedValue ?? 0),
              status,
              dateRegistered: formatDateOnly(property.registrationDate ?? property.createdAt),
              raw: property,
            }
          })
          .sort((left, right) => left.id.localeCompare(right.id))

        setProperties(mapped)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load properties.')
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [])

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        property.id.toLowerCase().includes(query) ||
        property.owner.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query)
      const matchesType = typeFilter === 'All' || property.propertyType === typeFilter
      const matchesStatus = statusFilter === 'All' || property.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [properties, search, statusFilter, typeFilter])

  const totals = useMemo(() => {
    const assessed = properties.reduce((sum, property) => sum + property.assessedValue, 0)
    return {
      total: properties.length,
      active: properties.filter((property) => property.status === 'Active').length,
      pending: properties.filter((property) => property.status === 'Pending').length,
      assessed,
      averageAssessed: properties.length > 0 ? assessed / properties.length : 0,
    }
  }, [properties])

  const typeOptions = useMemo(
    () => propertyTypeOrder.filter((type) => properties.some((property) => property.propertyType === type)),
    [properties],
  )

  const statusOptions = useMemo(
    () => propertyStatusOrder.filter((status) => properties.some((property) => property.status === status)),
    [properties],
  )

  const hasFilters = search.trim().length > 0 || typeFilter !== 'All' || statusFilter !== 'All'

  const openManager = () => navigate('/app/property-registration/manage')

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('All')
    setStatusFilter('All')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      <WorkspaceHero
        eyebrow="Property Registry"
        title="Property records that are easier to scan, filter, and act on."
        description="Review live registry data, narrow results quickly, and open the full workspace only when you need to create, update, or archive records."
        actions={
          canManage ? (
            <ActionButton icon={canCreate ? Plus : Edit3} variant="primary" onClick={openManager}>
              Open Property Workspace
            </ActionButton>
          ) : undefined
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">{loading ? 'Loading records' : `${properties.length} live records`}</Pill>
            <Pill tone={isReadOnly ? 'amber' : 'emerald'}>{isReadOnly ? 'Read-only mode' : 'Workspace actions enabled'}</Pill>
            <Pill tone="slate">{loading ? 'Syncing filters' : `${filtered.length} match current filters`}</Pill>
          </div>
        }
      />

      {isReadOnly && (
        <ReadOnlyBanner
          message={`Read-Only Mode — ${user?.role} accounts can inspect live property data here, while any create, edit, or archive work stays inside the full property workspace.`}
        />
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Unable to load property records</p>
            <p className="mt-1 text-xs leading-5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Properties"
          value={loading ? '—' : totals.total}
          hint="All property records currently available from the live registry."
          icon={Home}
          tone="blue"
        />
        <StatCard
          label="Active Records"
          value={loading ? '—' : totals.active}
          hint="Properties currently marked active and ready for operational use."
          icon={Landmark}
          tone="emerald"
        />
        <StatCard
          label="Pending Review"
          value={loading ? '—' : totals.pending}
          hint="Entries that still need validation or follow-up inside the manager workspace."
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Assessed Portfolio"
          value={loading ? '—' : formatCurrency(totals.assessed)}
          hint={loading ? 'Calculating assessed totals.' : `Average assessed value: ${formatCurrency(totals.averageAssessed)}`}
          icon={Layers3}
          tone="cyan"
        />
      </div>

      <SectionPanel
        title="Registry Records"
        description="Search, filter, and inspect live property rows without leaving the summary view."
        icon={Home}
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
                placeholder="Search property number, owner reference, or address"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${surfaceInputClassName} pl-11`}
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Property Type</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'All' | PropertyType)}
              className={surfaceSelectClassName}
            >
              <option value="All">All property types</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {typeMeta[type].label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'All' | PropertyStatus)}
              className={surfaceSelectClassName}
            >
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
                Showing {loading ? '—' : filtered.length} of {properties.length} properties
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use the workspace for write actions. This screen is optimized for scanning, filtering, and checking record details.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {search.trim() && <Pill tone="blue">Query: {search.trim().slice(0, 24)}</Pill>}
              {typeFilter !== 'All' && <Pill tone={typeMeta[typeFilter].tone}>{typeMeta[typeFilter].label}</Pill>}
              {statusFilter !== 'All' && <Pill tone={statusTone[statusFilter]}>{statusFilter}</Pill>}
              {!hasFilters && <Pill tone="slate">No active filters</Pill>}
            </div>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Loading property records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No properties match the current search and filter combination.
            </div>
          ) : (
            filtered.map((property) => {
              const TypeIcon = typeMeta[property.propertyType].icon

              return (
                <article key={property.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pill tone="slate">{property.id}</Pill>
                        <Pill tone={typeMeta[property.propertyType].tone}>
                          <TypeIcon className="h-3.5 w-3.5" />
                          {typeMeta[property.propertyType].label}
                        </Pill>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-950">{property.owner}</p>
                      <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        <span>{property.address || 'No address on file'}</span>
                      </p>
                    </div>
                    <Pill tone={statusTone[property.status]}>{property.status}</Pill>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Area</dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">
                        {property.areaSqm > 0 ? `${property.areaSqm.toLocaleString()} sqm` : '—'}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Registered</dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">{property.dateRegistered}</dd>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Market Value</dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(property.marketValue)}</dd>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Assessed Value</dt>
                      <dd className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(property.assessedValue)}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton icon={Eye} onClick={() => setSelected(property)} fluidOnMobile={false}>
                      View details
                    </ActionButton>
                    {canManage && (
                      <ActionButton icon={ArrowUpRight} variant="secondary" onClick={openManager} fluidOnMobile={false}>
                        Open workspace
                      </ActionButton>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Property</th>
                  <th className="px-5 py-3.5">Owner</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Area</th>
                  <th className="px-5 py-3.5 text-right">Market Value</th>
                  <th className="px-5 py-3.5 text-right">Assessed Value</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                      Loading property records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                      No properties match the current search and filter combination.
                    </td>
                  </tr>
                ) : (
                  filtered.map((property) => {
                    const TypeIcon = typeMeta[property.propertyType].icon

                    return (
                      <tr key={property.id} className="align-top transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <p className="text-sm font-semibold text-slate-950">{property.id}</p>
                            <p className="text-xs text-slate-500">{property.titleNumber}</p>
                            <p className="max-w-[260px] whitespace-normal text-[12px] leading-5 text-slate-500">
                              {property.address || 'No address on file'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{property.owner}</td>
                        <td className="px-5 py-4">
                          <Pill tone={typeMeta[property.propertyType].tone}>
                            <TypeIcon className="h-3.5 w-3.5" />
                            {typeMeta[property.propertyType].label}
                          </Pill>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          {property.areaSqm > 0 ? `${property.areaSqm.toLocaleString()} sqm` : '—'}
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-slate-700">{formatCurrency(property.marketValue)}</td>
                        <td className="px-5 py-4 text-right text-sm font-semibold text-slate-950">
                          {formatCurrency(property.assessedValue)}
                        </td>
                        <td className="px-5 py-4">
                          <Pill tone={statusTone[property.status]}>{property.status}</Pill>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              icon={Eye}
                              variant="secondary"
                              className={`${tableActionButtonClass} text-sky-700 hover:border-sky-200 hover:bg-sky-50`}
                              onClick={() => setSelected(property)}
                              fluidOnMobile={false}
                              aria-label={`View details for ${property.id}`}
                              title={`View details for ${property.id}`}
                            />
                            {canManage && (
                              <ActionButton
                                icon={ArrowUpRight}
                                variant="secondary"
                                className={`${tableActionButtonClass} hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900`}
                                onClick={openManager}
                                fluidOnMobile={false}
                                aria-label={`Open workspace for ${property.id}`}
                                title={`Open workspace for ${property.id}`}
                              />
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
      </SectionPanel>

      {selected && (
        <DetailDialog
          title="Property Details"
          subtitle={`${selected.id} • ${selected.owner}`}
          badge={
            <div className="flex flex-wrap gap-2">
              <Pill tone={typeMeta[selected.propertyType].tone}>{typeMeta[selected.propertyType].label}</Pill>
              <Pill tone={statusTone[selected.status]}>{selected.status}</Pill>
            </div>
          }
          onClose={() => setSelected(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setSelected(null)}>
                Close
              </ActionButton>
              {canManage && (
                <ActionButton icon={ArrowUpRight} variant="primary" onClick={openManager}>
                  Open Property Workspace
                </ActionButton>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Market Value</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(selected.marketValue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Assessed Value</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(selected.assessedValue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Area</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {selected.areaSqm > 0 ? `${selected.areaSqm.toLocaleString()} sqm` : '—'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Location and title</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{selected.titleNumber}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selected.address || 'No address on file'}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 px-4 py-1 sm:px-5">
              <DetailRow label="Property ID" value={selected.propertyId} />
              <DetailRow label="Owner Reference" value={selected.owner} />
              <DetailRow label="Property Type" value={typeMeta[selected.propertyType].label} />
              <DetailRow label="Status" value={selected.status} />
              <DetailRow label="Date Registered" value={selected.dateRegistered} />
              <DetailRow label="Database Record" value={`#${selected.raw.propertyId}`} />
            </div>
          </div>
        </DetailDialog>
      )}
    </div>
  )
}
