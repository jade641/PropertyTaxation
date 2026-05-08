import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BarChart2,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  FolderOpen,
  History,
  Home,
  LayoutDashboard,
  Shield,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

export type ColorKey =
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'emerald'
  | 'teal'
  | 'amber'
  | 'orange'
  | 'red'
  | 'purple'

export const COLOR_MAP: Record<
  ColorKey,
  { bg: string; text: string; border: string; badge: string }
> = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-700',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
  },
}

export type Highlight = {
  icon: LucideIcon
  title: string
  desc: string
  color: ColorKey
}

export const HIGHLIGHTS: Highlight[] = [
  {
    icon: Shield,
    title: 'Role-Based Access Control',
    desc: '4 distinct roles with granular permission mapping — Admin, Accountant, Staff Encoder, and Auditor — each with precise module-level access.',
    color: 'blue',
  },
  {
    icon: Zap,
    title: 'AI Anomaly Detection',
    desc: 'Machine learning model trained on 3,847+ property records flags assessed values outside normal range for immediate audit review.',
    color: 'violet',
  },
  {
    icon: BarChart2,
    title: 'Live KPI Dashboard',
    desc: 'Executive dashboard with real-time tax collection charts, compliance gauge, and revenue forecasting.',
    color: 'emerald',
  },
  {
    icon: Award,
    title: 'Audit-Ready Compliance',
    desc: 'Read-only audit trail, severity-filtered logs, exportable reports, and a dedicated Auditor role for COA compliance.',
    color: 'amber',
  },
  {
    icon: Star,
    title: 'LGC-Compliant Computations',
    desc: 'RPT auto-calculation supports basic tax, SEF levy, surcharges, penalties, and early payment discounts.',
    color: 'teal',
  },
  {
    icon: Building2,
    title: 'Multi-Barangay Support',
    desc: 'Manage properties across Davao Region barangays, including Davao del Sur, Davao del Norte, Davao de Oro, Davao Oriental, Davao Occidental, and Davao City, with breakdown summaries and collection efficiency reporting.',
    color: 'orange',
  },
]

export type ModuleItem = {
  icon: LucideIcon
  name: string
  desc: string
  color: ColorKey
}

export const MODULES: ModuleItem[] = [
  {
    icon: LayoutDashboard,
    name: 'Executive Dashboard',
    desc: 'Real-time KPIs, compliance gauge, revenue charts, and anomaly alerts.',
    color: 'blue',
  },
  {
    icon: Home,
    name: 'Property Registry',
    desc: 'Register and manage properties across Davao Region LGUs by barangay, type, and assessed value.',
    color: 'indigo',
  },
  {
    icon: Calculator,
    name: 'Tax Calculation',
    desc: 'Compute RPT using assessed value, tax rates, surcharges, and penalties.',
    color: 'violet',
  },
  {
    icon: CreditCard,
    name: 'Payment Management',
    desc: 'Record payments, generate receipts, and track collection per property.',
    color: 'emerald',
  },
  {
    icon: ShieldCheck,
    name: 'Compliance Monitoring',
    desc: 'Track compliance status, delinquencies, and deadline calendars.',
    color: 'teal',
  },
  {
    icon: FolderOpen,
    name: 'Filing & Documentation',
    desc: 'Upload and manage TD/TCT/declarations and official property documents.',
    color: 'amber',
  },
  {
    icon: FileText,
    name: 'Government Reporting',
    desc: 'Generate barangay summaries, monthly collections, and annual Davao Region filings.',
    color: 'orange',
  },
  {
    icon: History,
    name: 'Audit Support',
    desc: 'Full activity trail with exportable audit logs.',
    color: 'red',
  },
  {
    icon: Users,
    name: 'User Management',
    desc: 'Manage accounts, assign roles, and set department access levels.',
    color: 'purple',
  },
]

export type RoleItem = {
  name: string
  level: 1 | 2 | 3 | 4
  modules: number
  desc: string
  badge: string
  bar: string
}

export const ROLES: RoleItem[] = [
  {
    name: 'Admin',
    level: 4,
    modules: 9,
    desc: 'Full system access — all modules including user management and settings.',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    bar: 'bg-purple-500',
  },
  {
    name: 'Accountant',
    level: 3,
    modules: 7,
    desc: 'Tax computation, payments, compliance, reporting, and document filing.',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    bar: 'bg-blue-500',
  },
  {
    name: 'Staff (Encoder)',
    level: 2,
    modules: 6,
    desc: 'Property registration entry, payment recording, and basic filing access.',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    bar: 'bg-slate-500',
  },
  {
    name: 'Auditor',
    level: 1,
    modules: 7,
    desc: 'Read-only access across data modules. Compliance verification and audit log review.',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    bar: 'bg-amber-500',
  },
]

export type StatItem = {
  value: number
  suffix?: string
  prefix?: string
  label: string
  icon: LucideIcon
  colorClass: string
}

export const STATS: StatItem[] = [
  {
    value: 3847,
    label: 'Properties Registered',
    icon: Home,
    colorClass: 'text-blue-300',
  },
  {
    value: 16,
    prefix: '₱',
    suffix: '.84M',
    label: 'Tax Collected YTD',
    icon: TrendingUp,
    colorClass: 'text-emerald-300',
  },
  {
    value: 73,
    suffix: '.8%',
    label: 'Compliance Rate',
    icon: ShieldCheck,
    colorClass: 'text-amber-300',
  },
  {
    value: 9,
    label: 'Core Modules',
    icon: LayoutDashboard,
    colorClass: 'text-violet-300',
  },
]
