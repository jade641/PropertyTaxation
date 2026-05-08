import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FilterX,
  History,
  Lock,
  Search,
  Shield,
  Users,
} from 'lucide-react'
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
import { buildUserDisplayName, buildUserMap, formatDateTime } from '../lib/liveData'
import type { ApiActivityLog, ApiUsersResponse } from '../lib/liveData'

type SeverityType = 'info' | 'warning' | 'critical'
type ViewMode = 'table' | 'timeline'

type AuditLogItem = {
  id: string
  user: string
  role: string
  action: string
  details: string
  timestamp: string
  rawTimestamp: string
  ip: string
  severity: SeverityType
  module: string
}

const ALL_ROLES = ['Admin', 'Accountant', 'Staff', 'System', 'Auditor']
const PER_PAGE = 8

const severityConfig: Record<SeverityType, { dot: string; label: string; rowBg: string }> = {
  info: { dot: 'bg-blue-400', label: 'Info', rowBg: '' },
  warning: { dot: 'bg-amber-400', label: 'Warning', rowBg: 'bg-amber-50/30' },
  critical: { dot: 'bg-red-500 animate-pulse', label: 'Critical', rowBg: 'bg-red-50/40' },
}

const roleColors = (role: string) => {
  switch (role) {
    case 'Admin':
      return 'bg-purple-100 text-purple-700'
    case 'Accountant':
      return 'bg-blue-100 text-blue-700'
    case 'Auditor':
      return 'bg-amber-100 text-amber-700'
    case 'Staff':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-200 text-slate-600'
  }
}

const actionColors = (action: string) => {
  const lower = action.toLowerCase()
  if (lower.includes('delete')) return 'bg-red-100 text-red-700'
  if (lower.includes('payment')) return 'bg-emerald-100 text-emerald-700'
  if (lower.includes('tax')) return 'bg-amber-100 text-amber-700'
  if (lower.includes('report')) return 'bg-indigo-100 text-indigo-700'
  if (lower.includes('document') || lower.includes('upload')) return 'bg-sky-100 text-sky-700'
  if (lower.includes('user') || lower.includes('role')) return 'bg-purple-100 text-purple-700'
  if (lower.includes('compliance')) return 'bg-teal-100 text-teal-700'
  if (lower.includes('property')) return 'bg-blue-100 text-blue-700'
  if (lower.includes('login') || lower.includes('auth')) return 'bg-slate-100 text-slate-700'
  return 'bg-slate-100 text-slate-700'
}

const normalizeSeverity = (value?: string | null): SeverityType => {
  const severity = String(value ?? '').toLowerCase()
  if (severity === 'critical' || severity === 'error' || severity === 'high') return 'critical'
  if (severity === 'warning' || severity === 'medium') return 'warning'
  return 'info'
}

const humanizeToken = (value: string) => {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const humanizeAction = (action: string, module: string) => {
  const cleaned = humanizeToken(action)
  if (cleaned) return cleaned
  return `${humanizeToken(module)} Activity`
}

const exportCsv = (logs: AuditLogItem[]) => {
  const rows = [
    ['Log ID', 'Timestamp', 'User', 'Role', 'Severity', 'Module', 'Action', 'Details', 'IP Address'],
    ...logs.map((log) => [
      log.id,
      log.timestamp,
      log.user,
      log.role,
      log.severity,
      log.module,
      log.action,
      log.details,
      log.ip,
    ]),
  ]

  const content = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const severityTone = (severity: SeverityType): SurfaceTone => {
  if (severity === 'critical') return 'rose'
  if (severity === 'warning') return 'amber'
  return 'blue'
}

const tableActionButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200'

export default function Audit() {
  const { can, user } = useAuth()

  if (!can('audit.view')) {
    return <AccessDenied requiredRole="Admin or Auditor" />
  }

  const isAuditor = user?.role === 'Auditor'
  const canExport = can('reporting.export')

  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All Actions')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [severityFilter, setSeverityFilter] = useState<'All' | SeverityType>('All')
  const [view, setView] = useState<ViewMode>('table')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditLogItem | null>(null)

  useEffect(() => {
    let active = true

    const loadLogs = async () => {
      setLoading(true)
      setError('')

      try {
        const [activityLogs, usersResponse] = await Promise.all([
          apiJson<ApiActivityLog[]>('/ActivityLogs'),
          apiJson<ApiUsersResponse>('/Users'),
        ])

        if (!active) return

        const userMap = buildUserMap(usersResponse.users)
        const mappedLogs = activityLogs
          .map((log) => {
            const matchedUser = log.userId ? userMap.get(log.userId) : undefined

            return {
              id: `LOG-${String(log.logId).padStart(4, '0')}`,
              user: matchedUser ? buildUserDisplayName(matchedUser) : 'System',
              role: matchedUser?.role ?? 'System',
              action: humanizeAction(log.action, log.module),
              details:
                log.description?.trim() ||
                `${humanizeAction(log.action, log.module)} in ${humanizeToken(log.module || 'system')}`,
              timestamp: formatDateTime(log.createdAt),
              rawTimestamp: log.createdAt ?? '',
              ip: log.ipAddress || '—',
              severity: normalizeSeverity(log.severity),
              module: humanizeToken(log.module || 'System'),
            }
          })
          .sort((left, right) => {
            const leftTime = new Date(left.rawTimestamp).getTime()
            const rightTime = new Date(right.rawTimestamp).getTime()
            return rightTime - leftTime
          })

        setLogs(mappedLogs)
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load audit logs.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadLogs()

    return () => {
      active = false
    }
  }, [])

  const allActions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action))).sort((left, right) => left.localeCompare(right))
  }, [logs])

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        log.user.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.id.toLowerCase().includes(query) ||
        log.module.toLowerCase().includes(query)
      const matchesAction = actionFilter === 'All Actions' || log.action === actionFilter
      const matchesRole = roleFilter === 'All Roles' || log.role === roleFilter
      const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter
      return matchesSearch && matchesAction && matchesRole && matchesSeverity
    })
  }, [actionFilter, logs, roleFilter, search, severityFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [actionFilter, roleFilter, search, severityFilter])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const counts = {
    info: logs.filter((log) => log.severity === 'info').length,
    warning: logs.filter((log) => log.severity === 'warning').length,
    critical: logs.filter((log) => log.severity === 'critical').length,
  }

  const firstCritical = logs.find((log) => log.severity === 'critical') ?? null

  const auditStats = {
    totalLogs: logs.length,
    criticalCount: counts.critical,
    warningCount: counts.warning,
    usersTracked: new Set(logs.map((log) => log.user)).size,
  }

  const hasFilters =
    search.trim().length > 0 ||
    actionFilter !== 'All Actions' ||
    roleFilter !== 'All Roles' ||
    severityFilter !== 'All'

  const resetFilters = () => {
    setSearch('')
    setActionFilter('All Actions')
    setRoleFilter('All Roles')
    setSeverityFilter('All')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      <WorkspaceHero
        eyebrow="Audit Support"
        title="Immutable activity trail for system accountability and review."
        description="Browse login events, data changes, and system actions. Auditors can view and export the full log. Admins see all role activity."
        actions={
          canExport ? (
            <ActionButton icon={Download} variant="primary" onClick={() => exportCsv(filtered)}>
              Export Trail
            </ActionButton>
          ) : undefined
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">{loading ? 'Loading logs' : `${logs.length} total entries`}</Pill>
            <Pill tone="rose">{loading ? '—' : `${counts.critical} critical`}</Pill>
            <Pill tone="amber">{loading ? '—' : `${counts.warning} warnings`}</Pill>
            <Pill tone="slate">{loading ? 'Syncing' : `${filtered.length} match current filters`}</Pill>
          </div>
        }
      />

      {isAuditor && (
        <ReadOnlyBanner message="Read-Only Access — Audit logs are immutable records. Auditor accounts can view, filter, and export logs but cannot modify any entries." />
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Unable to load audit logs</p>
            <p className="mt-1 text-xs leading-5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Entries"
          value={loading ? '—' : auditStats.totalLogs}
          hint="All activity log entries currently loaded from the live system."
          icon={FileText}
          tone="blue"
        />
        <StatCard
          label="Critical Events"
          value={loading ? '—' : auditStats.criticalCount}
          hint="High-severity entries that may require immediate review or follow-up."
          icon={AlertTriangle}
          tone="rose"
        />
        <StatCard
          label="Warning Events"
          value={loading ? '—' : auditStats.warningCount}
          hint="Medium-severity entries worth monitoring for patterns."
          icon={Shield}
          tone="amber"
        />
        <StatCard
          label="Users Tracked"
          value={loading ? '—' : auditStats.usersTracked}
          hint="Distinct user accounts that appear in the current log set."
          icon={Users}
          tone="cyan"
        />
      </div>

      {isAuditor && firstCritical && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-900">
              {counts.critical} Critical Event{counts.critical > 1 ? 's' : ''} Detected
            </p>
            <p className="mt-1 text-xs leading-5 text-rose-700">
              Latest flagged entry: <span className="font-semibold">{firstCritical.id}</span> — {firstCritical.details}
            </p>
          </div>
          <ActionButton
            icon={FilterX}
            variant="ghost"
            onClick={() => { setSeverityFilter('critical'); setPage(1) }}
            fluidOnMobile={false}
          >
            Show critical
          </ActionButton>
        </div>
      )}

      <SectionPanel
        title="Activity Log"
        description="Search and filter the immutable audit trail. Switch to Timeline for a chronological event view."
        icon={History}
        badge={<Pill tone="slate">{loading ? 'Loading' : `${filtered.length} shown`}</Pill>}
        actions={
          <div className="flex flex-wrap gap-2">
            {hasFilters && (
              <ActionButton icon={FilterX} variant="ghost" onClick={resetFilters}>
                Reset filters
              </ActionButton>
            )}
            <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setView('table')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${view === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                Table
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${view === 'timeline' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                Timeline
              </button>
            </div>
          </div>
        }
        bodyClassName="space-y-5"
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_200px_180px_180px]">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user, action, module, ID, details..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${surfaceInputClassName} pl-11`}
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Action</span>
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className={surfaceSelectClassName}>
              <option>All Actions</option>
              {allActions.map((action) => <option key={action}>{action}</option>)}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className={surfaceSelectClassName}>
              <option>All Roles</option>
              {ALL_ROLES.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Severity</span>
            <select
              value={severityFilter}
              onChange={(event) => { setSeverityFilter(event.target.value as 'All' | SeverityType); setPage(1) }}
              className={surfaceSelectClassName}
            >
              <option value="All">All severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Showing {loading ? '—' : filtered.length} of {logs.length} entries — page {page} of {totalPages}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Audit logs are read-only and cannot be modified or deleted from any interface.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {search.trim() && <Pill tone="blue">Query: {search.trim().slice(0, 24)}</Pill>}
              {actionFilter !== 'All Actions' && <Pill tone="slate">{actionFilter}</Pill>}
              {roleFilter !== 'All Roles' && <Pill tone="slate">{roleFilter}</Pill>}
              {severityFilter !== 'All' && <Pill tone={severityTone(severityFilter as SeverityType)}>{severityConfig[severityFilter as SeverityType].label}</Pill>}
              {!hasFilters && <Pill tone="slate">No active filters</Pill>}
            </div>
          </div>
        </div>

        {view === 'table' ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Severity</th>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">User / Role</th>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Details</th>
                      <th className="px-5 py-3.5">IP Address</th>
                      <th className="px-5 py-3.5 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">Loading audit logs...</td></tr>
                    ) : paginated.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">No audit logs match the current filters.</td></tr>
                    ) : (
                      paginated.map((log) => (
                        <tr key={log.id} className={`align-top transition-colors hover:bg-slate-50/80 ${severityConfig[log.severity].rowBg}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityConfig[log.severity].dot}`} />
                              <Pill tone={severityTone(log.severity)}>{severityConfig[log.severity].label}</Pill>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                              <History className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {log.timestamp}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleColors(log.role)}`}>
                                {log.user.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-900">{log.user}</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${roleColors(log.role)}`}>{log.role}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${actionColors(log.action)}`}>{log.action}</span>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                          <td className="px-5 py-4 text-xs text-slate-400 font-mono">{log.ip}</td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <ActionButton
                                icon={Eye}
                                variant="secondary"
                                className={`${tableActionButtonClass} text-sky-700 hover:border-sky-200 hover:bg-sky-50`}
                                onClick={() => setSelected(log)}
                                fluidOnMobile={false}
                                aria-label={`View ${log.id}`}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Loading audit logs...</div>
              ) : paginated.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No audit logs match the current filters.</div>
              ) : (
                paginated.map((log) => (
                  <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Pill tone="slate">{log.id}</Pill>
                      <Pill tone={severityTone(log.severity)}>{severityConfig[log.severity].label}</Pill>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{log.user}</p>
                    <p className="text-xs text-slate-500 mt-1">{log.action} • {log.module}</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{log.timestamp}</p>
                    <div className="mt-3 flex gap-2">
                      <ActionButton icon={Eye} onClick={() => setSelected(log)} fluidOnMobile={false}>View details</ActionButton>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                Read-only · {filtered.length} entries · {logs.length} total
              </span>
              <div className="flex gap-1">
                <ActionButton variant="secondary" onClick={() => setPage((c) => Math.max(1, c - 1))} disabled={page === 1} fluidOnMobile={false} className="h-8 px-3 text-xs">Prev</ActionButton>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`h-8 w-8 rounded-xl text-xs font-medium transition-colors ${pageNumber === page ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <ActionButton variant="secondary" onClick={() => setPage((c) => Math.min(totalPages, c + 1))} disabled={page === totalPages} fluidOnMobile={false} className="h-8 px-3 text-xs">Next</ActionButton>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-0">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Loading audit timeline...</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No logs match the current filters.</div>
            ) : (
              filtered.map((log, index) => (
                <div key={log.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 z-10 ${severityConfig[log.severity].dot}`} />
                    {index < filtered.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="flex-1 pb-5 min-w-0">
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-sky-200 hover:shadow-md">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${roleColors(log.role)}`}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-900">{log.user}</p>
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${actionColors(log.action)}`}>{log.action}</span>
                          <Pill tone={severityTone(log.severity)}>{severityConfig[log.severity].label}</Pill>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 truncate">{log.details}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                          <span className="text-[10px] text-slate-400 font-mono">IP: {log.ip}</span>
                          <span className="text-[10px] text-slate-400">{log.id}</span>
                          <span className="text-[10px] text-slate-400">{log.module}</span>
                        </div>
                      </div>
                      <ActionButton
                        icon={Eye}
                        variant="secondary"
                        className={`${tableActionButtonClass} text-sky-700 hover:border-sky-200 hover:bg-sky-50 flex-shrink-0`}
                        onClick={() => setSelected(log)}
                        fluidOnMobile={false}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </SectionPanel>

      {selected && (
        <DetailDialog
          title="Audit Log Detail"
          subtitle={`${selected.id} • ${selected.module}`}
          badge={
            <div className="flex flex-wrap gap-2">
              <Pill tone={severityTone(selected.severity)}>{severityConfig[selected.severity].label}</Pill>
            </div>
          }
          onClose={() => setSelected(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setSelected(null)}>Close</ActionButton>
              {canExport && (
                <ActionButton icon={Download} variant="primary" onClick={() => exportCsv([selected])}>
                  Export Entry
                </ActionButton>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Full Details</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{selected.details}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-1 sm:px-5">
              <DetailRow label="Log ID" value={selected.id} />
              <DetailRow label="Timestamp" value={selected.timestamp} />
              <DetailRow label="User" value={selected.user} />
              <DetailRow label="Role" value={selected.role} />
              <DetailRow label="Module" value={selected.module} />
              <DetailRow label="Action" value={selected.action} />
              <DetailRow label="IP Address" value={selected.ip} />
              <DetailRow label="Severity" value={severityConfig[selected.severity].label} emphasize />
            </div>
            {isAuditor && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Auditor Note</p>
                <p className="mt-2 text-xs leading-5 text-amber-800">
                  Cross-reference this activity with <strong>Compliance Monitoring</strong> and <strong>Property Registry</strong> to verify data integrity.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-600">Audit logs are read-only and cannot be modified or deleted.</p>
            </div>
          </div>
        </DetailDialog>
      )}
    </div>
  )
}
