import {
  LayoutDashboard,
  Home,
  Calculator,
  CreditCard,
  FileText,
  ShieldCheck,
  FolderOpen,
  History,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PermissionLevel = "none" | "read" | "write" | "full";

export interface ModuleConfig {
  name: string;
  path: string;
  icon: LucideIcon;
  description: string;
  permission: PermissionLevel;
}

export interface RoleConfig {
  label: string;
  accessLevel: number;
  badgeClass: string;
  bgClass: string;
  textClass: string;
  description: string;
  modules: ModuleConfig[];
}

// Centralized role-based module configuration
export const roleModules: Record<string, RoleConfig> = {
  Admin: {
    label: "Admin",
    accessLevel: 4,
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    bgClass: "bg-gradient-to-br from-blue-50 to-cyan-50",
    textClass: "text-blue-600",
    description: "Full system access · User management · System configuration · All reports",
    modules: [
      {
        name: "Dashboard",
        path: "/app",
        icon: LayoutDashboard,
        description: "Overview & KPIs",
        permission: "full",
      },
      {
        name: "Property Registry",
        path: "/app/property-registration",
        icon: Home,
        description: "Register & manage properties",
        permission: "full",
      },
      {
        name: "Tax Calculation",
        path: "/app/tax-calculation",
        icon: Calculator,
        description: "RPT computation & rates",
        permission: "full",
      },
      {
        name: "Payment Management",
        path: "/app/payment-management",
        icon: CreditCard,
        description: "Record & track payments",
        permission: "full",
      },
      {
        name: "Compliance",
        path: "/app/compliance",
        icon: ShieldCheck,
        description: "Deadlines & compliance status",
        permission: "full",
      },
      {
        name: "Filing & Docs",
        path: "/app/filing",
        icon: FolderOpen,
        description: "Document repository",
        permission: "full",
      },
      {
        name: "Govt Reporting",
        path: "/app/reporting",
        icon: FileText,
        description: "Barangay & Davao Region LGU reports",
        permission: "full",
      },
      {
        name: "Audit Support",
        path: "/app/audit",
        icon: History,
        description: "System activity logs",
        permission: "full",
      },
      {
        name: "User Management",
        path: "/app/users",
        icon: Users,
        description: "Accounts & roles",
        permission: "full",
      },
    ],
  },

  Accountant: {
    label: "Accountant",
    accessLevel: 3,
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    bgClass: "bg-gradient-to-br from-emerald-50 to-teal-50",
    textClass: "text-emerald-600",
    description: "Financial operations · Payment processing · Tax assessment · Financial reports",
    modules: [
      {
        name: "Dashboard",
        path: "/app",
        icon: LayoutDashboard,
        description: "Overview & KPIs",
        permission: "read",
      },
      {
        name: "Property Registry",
        path: "/app/property-registration",
        icon: Home,
        description: "Register & manage properties",
        permission: "write",
      },
      {
        name: "Tax Calculation",
        path: "/app/tax-calculation",
        icon: Calculator,
        description: "RPT computation & rates",
        permission: "write",
      },
      {
        name: "Payment Management",
        path: "/app/payment-management",
        icon: CreditCard,
        description: "Record & track payments",
        permission: "full",
      },
      {
        name: "Compliance",
        path: "/app/compliance",
        icon: ShieldCheck,
        description: "Deadlines & compliance status",
        permission: "write",
      },
      {
        name: "Filing & Docs",
        path: "/app/filing",
        icon: FolderOpen,
        description: "Document repository",
        permission: "full",
      },
      {
        name: "Govt Reporting",
        path: "/app/reporting",
        icon: FileText,
        description: "Barangay & Davao Region LGU reports",
        permission: "full",
      },
    ],
  },

  Auditor: {
    label: "Auditor",
    accessLevel: 1,
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    bgClass: "bg-gradient-to-br from-amber-50 to-orange-50",
    textClass: "text-amber-600",
    description: "Read-only access · Audit logs · Compliance monitoring · Export reports",
    modules: [
      {
        name: "Dashboard",
        path: "/app",
        icon: LayoutDashboard,
        description: "Overview & KPIs",
        permission: "read",
      },
      {
        name: "Property Registry",
        path: "/app/property-registration",
        icon: Home,
        description: "Register & manage properties",
        permission: "read",
      },
      {
        name: "Tax Calculation",
        path: "/app/tax-calculation",
        icon: Calculator,
        description: "RPT computation & rates",
        permission: "read",
      },
      {
        name: "Payment Management",
        path: "/app/payment-management",
        icon: CreditCard,
        description: "Record & track payments",
        permission: "read",
      },
      {
        name: "Compliance",
        path: "/app/compliance",
        icon: ShieldCheck,
        description: "Deadlines & compliance status",
        permission: "read",
      },
      {
        name: "Govt Reporting",
        path: "/app/reporting",
        icon: FileText,
        description: "Barangay & Davao Region LGU reports",
        permission: "read",
      },
      {
        name: "Audit Support",
        path: "/app/audit",
        icon: History,
        description: "System activity logs",
        permission: "read",
      },
    ],
  },

  Staff: {
    label: "Staff",
    accessLevel: 2,
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    bgClass: "bg-gradient-to-br from-slate-50 to-gray-50",
    textClass: "text-slate-600",
    description: "Property registration · Tax assessment · Document upload · Basic reports",
    modules: [
      {
        name: "Dashboard",
        path: "/app",
        icon: LayoutDashboard,
        description: "Overview & KPIs",
        permission: "read",
      },
      {
        name: "Property Registry",
        path: "/app/property-registration",
        icon: Home,
        description: "Register & manage properties",
        permission: "full",
      },
      {
        name: "Tax Calculation",
        path: "/app/tax-calculation",
        icon: Calculator,
        description: "RPT computation & rates",
        permission: "read",
      },
      {
        name: "Payment Management",
        path: "/app/payment-management",
        icon: CreditCard,
        description: "Record & track payments",
        permission: "write",
      },
      {
        name: "Compliance",
        path: "/app/compliance",
        icon: ShieldCheck,
        description: "Deadlines & compliance status",
        permission: "read",
      },
      {
        name: "Filing & Docs",
        path: "/app/filing",
        icon: FolderOpen,
        description: "Document repository",
        permission: "write",
      },
    ],
  },
};

// Helper function to get role configuration
export function getRoleConfig(role: string): RoleConfig | null {
  return roleModules[role] || null;
}

// Helper function to check if user has access to a module
export function hasModuleAccess(role: string, modulePath: string): boolean {
  const config = getRoleConfig(role);
  if (!config) return false;
  return config.modules.some((module) => module.path === modulePath);
}

// Helper function to get module permission level
export function getModulePermission(role: string, modulePath: string): PermissionLevel {
  const config = getRoleConfig(role);
  if (!config) return "none";
  
  const module = config.modules.find((m) => m.path === modulePath);
  return module?.permission || "none";
}

// Helper function to check if user can perform write operations
export function canWrite(permission: PermissionLevel): boolean {
  return permission === "write" || permission === "full";
}

// Helper function to check if user can perform full CRUD operations
export function canFullAccess(permission: PermissionLevel): boolean {
  return permission === "full";
}

// Helper function to check if user has read-only access
export function isReadOnly(permission: PermissionLevel): boolean {
  return permission === "read";
}
