import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { apiJson } from "../lib/apiClient";

export type UserRole = "Admin" | "Accountant" | "Staff" | "Auditor";
export type Permission = string;

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  initials: string;
};

type ApiUser = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
};

type ApiLoginResponse = {
  token: string;
  user: ApiUser;
};

type RoleMeta = {
  label: string;
  description: string;
  accessLevel: number;
  badgeClass: string;
  bgClass: string;
  textClass: string;
  color: "blue" | "emerald" | "amber" | "slate";
};

export const ROLE_META: Record<UserRole, RoleMeta> = {
  Admin: {
    label: "Admin",
    description: "Full system access · Manage users and settings · Approve reports",
    accessLevel: 4,
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
    bgClass: "bg-blue-50 text-blue-700",
    textClass: "text-blue-700",
    color: "blue",
  },
  Accountant: {
    label: "Accountant",
    description: "Finance operations · Manage payments and rates · Generate reports",
    accessLevel: 3,
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bgClass: "bg-emerald-50 text-emerald-700",
    textClass: "text-emerald-700",
    color: "emerald",
  },
  Staff: {
    label: "Staff",
    description: "Data entry access · Upload documents · Limited edits",
    accessLevel: 2,
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    bgClass: "bg-amber-50 text-amber-700",
    textClass: "text-amber-700",
    color: "amber",
  },
  Auditor: {
    label: "Auditor",
    description: "Read-only access · Export audit data · No modifications",
    accessLevel: 1,
    badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
    bgClass: "bg-slate-50 text-slate-600",
    textClass: "text-slate-600",
    color: "slate",
  },
};

const AUTH_TOKEN_KEY = "taxsync.token";

const PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  Admin: [
    "dashboard.view",
    "property.view",
    "property.create",
    "property.edit",
    "property.delete",
    "tax.view",
    "tax.create",
    "tax.edit",
    "tax.delete",
    "payment.view",
    "payment.create",
    "payment.edit",
    "compliance.view",
    "compliance.update",
    "filing.view",
    "filing.upload",
    "filing.delete",
    "reporting.view",
    "reporting.generate",
    "reporting.submit",
    "reporting.export",
    "audit.view",
    "users.view",
    "settings.manage",
  ],
  Accountant: [
    "dashboard.view",
    "property.view",
    "property.create",
    "property.edit",
    "tax.view",
    "tax.create",
    "tax.edit",
    "payment.view",
    "payment.create",
    "payment.edit",
    "compliance.view",
    "compliance.update",
    "filing.view",
    "filing.upload",
    "filing.delete",
    "reporting.view",
    "reporting.generate",
    "reporting.submit",
    "reporting.export",
  ],
  Staff: [
    "dashboard.view",
    "property.view",
    "property.create",
    "tax.view",
    "payment.view",
    "payment.create",
    "compliance.view",
    "filing.view",
    "filing.upload",
  ],
  Auditor: [
    "dashboard.view",
    "property.view",
    "tax.view",
    "payment.view",
    "compliance.view",
    "reporting.view",
    "reporting.export",
    "audit.view",
  ],
};

export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return PERMISSIONS_BY_ROLE[role];
};

const ROLE_DEPARTMENTS: Record<UserRole, string> = {
  Admin: "System Administration",
  Accountant: "Treasury and Finance",
  Staff: "Assessment Division",
  Auditor: "Internal Audit",
};


type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  can: (permission: Permission) => boolean;
};

const DEFAULT_AUTH: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  login: async () => undefined,
  logout: () => undefined,
  hasPermission: () => false,
  can: () => false,
};

const AuthContext = createContext<AuthContextValue>(DEFAULT_AUTH);

const mapRole = (role?: string): UserRole => {
  switch (role) {
    case "Admin":
      return "Admin";
    case "Accountant":
      return "Accountant";
    case "Auditor":
      return "Auditor";
    case "Staff":
      return "Staff";
    default:
      return "Staff";
  }
};

const buildUserFromApi = (apiUser: ApiUser): User => {
  const role = mapRole(apiUser.role);
  const fullName = `${apiUser.firstName ?? ""} ${apiUser.lastName ?? ""}`.trim();
  const name = fullName || apiUser.username || "User";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: String(apiUser.userId),
    name,
    email: apiUser.email,
    role,
    department: ROLE_DEPARTMENTS[role] ?? "General",
    initials: initials || "U",
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const permissions = useMemo(() => {
    if (!user) return [];
    return getPermissionsForRole(user.role);
  }, [user]);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const data = await apiJson<ApiLoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: email, password }),
      retries: 4,
      timeoutMs: 12000,
    });

    if (!data?.token || !data?.user) {
      throw new Error("The server returned an invalid login response.");
    }

    setUser(buildUserFromApi(data.user));
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  };

  const hasPermission = (permission: Permission) => {
    return permissions.includes(permission);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    login,
    logout,
    hasPermission,
    can: hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
