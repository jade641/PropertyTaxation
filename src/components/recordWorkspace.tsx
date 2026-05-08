import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SurfaceTone = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'cyan'

const toneClasses: Record<SurfaceTone, { badge: string; icon: string }> = {
  slate: {
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: 'border-slate-200 bg-slate-100 text-slate-700',
  },
  blue: {
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  emerald: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  amber: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  rose: {
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  cyan: {
    badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    icon: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  },
}

const variantClasses = {
  primary:
    'border border-slate-900 bg-slate-900 text-white shadow-sm hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus-visible:ring-slate-900/20',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:ring-slate-300/60',
  ghost:
    'border border-transparent bg-slate-100 text-slate-700 hover:-translate-y-0.5 hover:bg-slate-200 focus-visible:ring-slate-300/60',
  danger:
    'border border-rose-200 bg-rose-50 text-rose-700 shadow-sm hover:-translate-y-0.5 hover:bg-rose-100 focus-visible:ring-rose-200/70',
} as const

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

export const surfaceInputClassName =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100'

export const surfaceSelectClassName = `${surfaceInputClassName} appearance-none pr-10`

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon
  variant?: keyof typeof variantClasses
  fluidOnMobile?: boolean
}

export function ActionButton({
  icon: Icon,
  variant = 'secondary',
  fluidOnMobile = true,
  type = 'button',
  className,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
        fluidOnMobile ? 'w-full justify-center sm:w-auto' : 'justify-center',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      {children}
    </button>
  )
}

type WorkspaceHeroProps = {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  footer?: ReactNode
}

export function WorkspaceHero({ eyebrow, title, description, actions, footer }: WorkspaceHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.11),_transparent_32%),linear-gradient(180deg,_rgba(248,250,252,0.94),_rgba(255,255,255,1))]" />
      <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 backdrop-blur">
            {eyebrow}
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">{title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">{description}</p>
          </div>
        </div>
        {actions && <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div>}
      </div>
      {footer && <div className="relative border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6 lg:px-8">{footer}</div>}
    </section>
  )
}

type StatCardProps = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: SurfaceTone
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'slate' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={cx('rounded-2xl border p-3', toneClasses[tone].icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {hint && <p className="mt-3 text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  )
}

type PillProps = {
  tone?: SurfaceTone
  className?: string
  children: ReactNode
}

export function Pill({ tone = 'slate', className, children }: PillProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
        toneClasses[tone].badge,
        className,
      )}
    >
      {children}
    </span>
  )
}

type SectionPanelProps = {
  title: string
  description?: string
  icon?: LucideIcon
  badge?: ReactNode
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function SectionPanel({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  className,
  bodyClassName,
  children,
}: SectionPanelProps) {
  return (
    <section className={cx('overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm', className)}>
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-sky-600" />}
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
            {badge}
          </div>
          {description && <p className="text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div>}
      </div>
      <div className={cx('px-5 py-5 sm:px-6', bodyClassName)}>{children}</div>
    </section>
  )
}

type DetailDialogProps = {
  title: string
  subtitle?: string
  badge?: ReactNode
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}

export function DetailDialog({ title, subtitle, badge, onClose, footer, children }: DetailDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center">
        <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
                {badge}
              </div>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-5">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

type DetailRowProps = {
  label: string
  value: ReactNode
  emphasize?: boolean
}

export function DetailRow({ label, value, emphasize = false }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <span className={cx('text-sm text-right text-slate-700', emphasize && 'font-semibold text-slate-950')}>{value}</span>
    </div>
  )
}