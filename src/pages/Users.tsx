import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Edit2, Eye, Lock, Mail, Shield, ShieldCheck, ShieldOff, Trash2, UserPlus, Users as UsersIcon, X } from "lucide-react";
import { useAuth, ROLE_META } from "../context/AuthContext";
import type { UserRole } from "../context/AuthContext";
import { AccessDenied } from "../components/RoleGuard";
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
} from "../components/recordWorkspace";
import type { SurfaceTone } from "../components/recordWorkspace";
import { apiJson } from "../lib/apiClient";

type UserStatus = "Active" | "Inactive" | "Pending" | "Suspended";

type ApiUser = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLogin?: string | null;
};

type ApiUsersResponse = {
  users: ApiUser[];
  total: number;
  page: number;
  pageSize: number;
};

type ApiHealthResponse = {
  status?: string;
  database?: string;
  mode?: string;
};

type SystemUser = {
  id: string; name: string; email: string; role: UserRole;
  status: UserStatus; lastLogin: string; department: string;
};

type UserForm = {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password: string;
};

const CREATABLE_ROLES: UserRole[] = ["Accountant", "Auditor", "Staff"];

const ROLE_DEPARTMENTS: Record<UserRole, string> = {
  Admin: "System Administration",
  Accountant: "Treasury and Finance",
  Staff: "Assessment Division",
  Auditor: "Internal Audit",
};

const toUserRole = (role?: string): UserRole => {
  switch (role) {
    case "Admin":
      return "Admin";
    case "Accountant":
      return "Accountant";
    case "Auditor":
      return "Auditor";
    case "Staff":
      return "Staff";
    case "TaxOfficer":
    case "Taxpayer":
      return "Staff";
    default:
      return "Staff";
  }
};

const toUserStatus = (status?: string): UserStatus => {
  switch (status) {
    case "Active":
      return "Active";
    case "Inactive":
      return "Inactive";
    case "Pending":
      return "Pending";
    case "Suspended":
      return "Suspended";
    default:
      return "Inactive";
  }
};

const formatLastLogin = (value?: string | null) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
};

const mapApiUser = (apiUser: ApiUser): SystemUser => {
  const role = toUserRole(apiUser.role);
  const fullName = `${apiUser.firstName ?? ""} ${apiUser.lastName ?? ""}`.trim();
  const name = fullName || apiUser.username || apiUser.email;

  return {
    id: String(apiUser.userId),
    name,
    email: apiUser.email,
    role,
    status: toUserStatus(apiUser.status),
    lastLogin: formatLastLogin(apiUser.lastLogin),
    department: ROLE_DEPARTMENTS[role] ?? "General",
  };
};

const splitFullName = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length < 2) return null;
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const buildUsername = (email: string, fallback: string) => {
  const localPart = email.split("@")[0] ?? "";
  const base = localPart || fallback.replace(/\s+/g, ".");
  const cleaned = base.toLowerCase().replace(/[^a-z0-9._-]/g, "");
  const trimmed = cleaned.slice(0, 50);
  if (trimmed.length >= 3) return trimmed;
  const suffix = Date.now().toString().slice(-6);
  return `user${suffix}`.slice(0, 50);
};

type ModalMode = "add"|"edit"|"delete"|"view"|null;
const EMPTY_FORM: UserForm = { name:"", email:"", role:"Staff", status:"Active", password:"" };
const PASSWORD_HELP_TEXT = "Use at least 12 characters with uppercase, lowercase, number, and symbol.";

const getRoleOptions = (mode: ModalMode, selectedRole?: UserRole): UserRole[] => {
  if (mode === "edit" && selectedRole === "Admin") {
    return ["Admin", ...CREATABLE_ROLES];
  }

  return CREATABLE_ROLES;
};

// Permission summary per role
const PERMISSION_SUMMARY: Record<UserRole, { module: string; access: string }[]> = {
  Admin: [
    { module: "Dashboard",         access: "Full access"              },
    { module: "Property Registry", access: "Full CRUD"                },
    { module: "Tax Calculation",   access: "Full CRUD + rate setting" },
    { module: "Payment Mgmt",      access: "Record, view & edit"      },
    { module: "Compliance",        access: "View & update status"     },
    { module: "Filing & Docs",     access: "Upload, view & delete"    },
    { module: "Govt Reporting",    access: "Generate, approve, export"},
    { module: "Audit Logs",        access: "View & export"            },
    { module: "User Management",   access: "Full CRUD"                },
  ],
  Accountant: [
    { module: "Dashboard",         access: "Full view"                },
    { module: "Property Registry", access: "View, add & edit"         },
    { module: "Tax Calculation",   access: "View & edit"              },
    { module: "Payment Mgmt",      access: "Record, view & edit"      },
    { module: "Compliance",        access: "View & update status"     },
    { module: "Filing & Docs",     access: "Upload, view & delete"    },
    { module: "Govt Reporting",    access: "Generate, submit, export" },
    { module: "Audit Logs",        access: "No access"                },
    { module: "User Management",   access: "No access"                },
  ],
  Staff: [
    { module: "Dashboard",         access: "Full view"                },
    { module: "Property Registry", access: "View & add only"          },
    { module: "Tax Calculation",   access: "View only"                },
    { module: "Payment Mgmt",      access: "Record & view only"       },
    { module: "Compliance",        access: "View only"                },
    { module: "Filing & Docs",     access: "Upload & view (no delete)"},
    { module: "Govt Reporting",    access: "No access"                },
    { module: "Audit Logs",        access: "No access"                },
    { module: "User Management",   access: "No access"                },
  ],
  Auditor: [
    { module: "Dashboard",         access: "View only"                           },
    { module: "Property Registry", access: "View only (read-only · no edits)"    },
    { module: "Tax Calculation",   access: "View only (read-only · no edits)"    },
    { module: "Payment Mgmt",      access: "View only (read-only · no edits)"    },
    { module: "Compliance",        access: "View & monitor (read-only)"           },
    { module: "Filing & Docs",     access: "No access"                           },
    { module: "Govt Reporting",    access: "View & export only (no generate)"    },
    { module: "Audit Logs",        access: "Full view · export · no modifications"},
    { module: "User Management",   access: "No access"                           },
  ],
};

const userStatusTone = (status: UserStatus): SurfaceTone => {
  switch (status) {
    case "Active": return "emerald";
    case "Pending": return "amber";
    case "Suspended": return "rose";
    default: return "slate";
  }
};

const tableActionButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200";

export default function Users() {
  const { can } = useAuth();

  // Admin-only module
  if (!can("users.view")) {
    return <AccessDenied requiredRole="Admin" />;
  }

  const [users,      setUsers]     = useState<SystemUser[]>([]);
  const [loading,    setLoading]   = useState(false);
  const [modal,      setModal]     = useState<ModalMode>(null);
  const [selected,   setSelected]  = useState<SystemUser | null>(null);
  const [form,       setForm]      = useState<UserForm>(EMPTY_FORM);
  const [search,     setSearch]    = useState("");
  const [roleFilter, setRoleFilter]= useState("All Roles");
  const [statFilter, setStatFilter]= useState("All");
  const [toast,      setToast]     = useState<{ msg: string; type: "success"|"error" } | null>(null);
  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>("Admin");
  const [usesTemporaryStorage, setUsesTemporaryStorage] = useState(false);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiJson<ApiUsersResponse>("/users");
      setUsers(data.users.map(mapApiUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load users.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadStorageMode = async () => {
    try {
      const health = await apiJson<ApiHealthResponse>("/health", {
        skipHealthCheck: true,
        retries: 0,
        timeoutMs: 3000,
      });

      setUsesTemporaryStorage((health.database ?? "").toLowerCase() === "in-memory");
    } catch {
      setUsesTemporaryStorage(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadStorageMode();
  }, []);

  const filteredUsers = users.filter((u) => {
    const mS = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase());
    const mR = roleFilter === "All Roles" || u.role === roleFilter;
    const mSt = statFilter === "All" || u.status === statFilter;
    return mS && mR && mSt;
  });

  const openAdd  = () => { setForm(EMPTY_FORM); setSelected(null); setModal("add"); };
  const openEdit = (u: SystemUser) => { setSelected(u); setForm({ name:u.name, email:u.email, role:u.role, status:u.status, password:"" }); setModal("edit"); };
  const openView = (u: SystemUser) => { setSelected(u); setModal("view"); };
  const openDel  = (u: SystemUser) => { setSelected(u); setModal("delete"); };

  const updateUserStatus = async (userId: string, status: UserStatus, silent = false) => {
    await apiJson<{ message: string }>(`/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });

    setUsers((p) => p.map((u) => (u.id === userId ? { ...u, status } : u)));
    if (!silent) {
      showToast(`User status set to ${status}.`);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast("Fill in all required fields.", "error");
      return;
    }

    if (modal === "add" && !form.password) {
      showToast("Enter an initial password for the user.", "error");
      return;
    }

    const nameParts = splitFullName(form.name);
    if (!nameParts) {
      showToast("Please enter both first and last name.", "error");
      return;
    }

    try {
      if (modal === "add") {
        const payload = {
          username: buildUsername(form.email, nameParts.firstName),
          email: form.email.trim(),
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          role: form.role,
          password: form.password,
        };

        const created = await apiJson<ApiUser>("/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const createdUser = {
          ...mapApiUser(created),
          status: form.status,
          lastLogin: "Never",
        };

        if (form.status !== "Active") {
          await updateUserStatus(createdUser.id, form.status, true);
        }

        await loadUsers();

        showToast(`User "${createdUser.name}" created with the assigned password.`);
      } else if (modal === "edit" && selected) {
        const payload = {
          email: form.email.trim(),
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          role: form.role,
          status: form.status,
        };

        const updated = await apiJson<ApiUser>(`/users/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        const updatedUser = {
          ...mapApiUser(updated),
          status: form.status,
        };

        await loadUsers();
        showToast(`User "${updatedUser.name}" updated.`);
      }

      setModal(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save user.";
      showToast(message, "error");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;

    try {
      await apiJson<{ message: string }>(`/users/${selected.id}`, {
        method: "DELETE",
      });

      await loadUsers();
      showToast("User removed from system.");
      setModal(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete user.";
      showToast(message, "error");
    }
  };

  const toggleStatus = async (u: SystemUser) => {
    const nextStatus: UserStatus = u.status === "Active" ? "Inactive" : "Active";

    try {
      await updateUserStatus(u.id, nextStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update status.";
      showToast(message, "error");
    }
  };

  const counts = { total: users.length, active: users.filter(u=>u.status==="Active").length, admin: users.filter(u=>u.role==="Admin").length, inactive: users.filter(u=>u.status==="Inactive").length };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-5 top-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-rose-500" />}
          {toast.msg}
        </div>
      )}

      <WorkspaceHero
        eyebrow="User Management"
        title="Manage system accounts, roles, and security permissions."
        description="Create and manage LGU staff accounts with role-based access control. Admins can add Accountant, Auditor, and Staff accounts. All changes are persisted to the database."
        actions={
          <ActionButton icon={UserPlus} variant="primary" onClick={openAdd}>
            Add New User
          </ActionButton>
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Pill tone="blue">{`${counts.total} total users`}</Pill>
            <Pill tone="emerald">{`${counts.active} active`}</Pill>
            <Pill tone="slate">{`${counts.inactive} inactive`}</Pill>
            <Pill tone="cyan">{`${counts.admin} admin`}</Pill>
          </div>
        }
      />

      {usesTemporaryStorage && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            Local development is currently using temporary in-memory storage. Create User is enabled for this session, but users created here will not appear in the MySQL <code>users</code> table unless the app is connected to a persistent backend.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users"    value={loading ? "—" : counts.total}    hint="All accounts registered in the system." icon={UsersIcon}   tone="blue"    />
        <StatCard label="Active"         value={loading ? "—" : counts.active}   hint="Accounts with active access to the system." icon={ShieldCheck} tone="emerald" />
        <StatCard label="Inactive"       value={loading ? "—" : counts.inactive} hint="Accounts that are deactivated or suspended." icon={ShieldOff}   tone="slate"   />
        <StatCard label="Admin Accounts" value={loading ? "—" : counts.admin}    hint="Accounts with full administrative access." icon={Shield}      tone="cyan"    />
      </div>

      <SectionPanel
        title="System Accounts"
        description="Search, filter, and manage all registered user accounts."
        icon={UsersIcon}
        badge={<Pill tone="slate">{loading ? "Loading" : `${filteredUsers.length} shown`}</Pill>}
        bodyClassName="space-y-5"
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_180px_180px]">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
            <div className="relative">
              <UsersIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${surfaceInputClassName} pl-11`}
              />
            </div>
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={surfaceSelectClassName}>
              <option>All Roles</option>
              {(["Admin", "Accountant", "Staff", "Auditor"] as UserRole[]).map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</span>
            <select value={statFilter} onChange={(e) => setStatFilter(e.target.value)} className={surfaceSelectClassName}>
              <option>All</option><option>Active</option><option>Inactive</option><option>Pending</option><option>Suspended</option>
            </select>
          </label>
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Active</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">Loading users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No users found.</td></tr>
                ) : (
                  filteredUsers.map((u) => {
                    const meta = ROLE_META[u.role];
                    return (
                      <tr key={u.id} className="align-top transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${meta.badgeClass}`}>
                              {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{u.name}</p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Mail className="h-3 w-3" />{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Pill tone="blue"><Shield className="h-3.5 w-3.5" /> {meta.label}</Pill>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{u.department}</td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleStatus(u)}
                            className="focus-visible:outline-none"
                            title={`Toggle status (currently ${u.status})`}
                          >
                            <Pill tone={userStatusTone(u.status)}>
                              <span className={`h-1.5 w-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                              {u.status}
                            </Pill>
                          </button>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{u.lastLogin}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <ActionButton icon={Eye} variant="secondary" className={`${tableActionButtonClass} text-sky-700 hover:border-sky-200 hover:bg-sky-50`} onClick={() => openView(u)} fluidOnMobile={false} title="View" />
                            <ActionButton icon={Edit2} variant="secondary" className={`${tableActionButtonClass} hover:border-sky-200 hover:bg-sky-50`} onClick={() => openEdit(u)} fluidOnMobile={false} title="Edit" />
                            <ActionButton icon={Trash2} variant="danger" className={`${tableActionButtonClass} text-rose-600 hover:border-rose-200 hover:bg-rose-50`} onClick={() => openDel(u)} fluidOnMobile={false} title="Delete" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">No users found.</div>
          ) : (
            filteredUsers.map((u) => {
              const meta = ROLE_META[u.role];
              return (
                <article key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${meta.badgeClass}`}>
                      {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-950">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Pill tone="blue"><Shield className="h-3.5 w-3.5" /> {meta.label}</Pill>
                    <button onClick={() => toggleStatus(u)}><Pill tone={userStatusTone(u.status)}>{u.status}</Pill></button>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton icon={Eye} onClick={() => openView(u)} fluidOnMobile={false}>View</ActionButton>
                    <ActionButton icon={Edit2} variant="secondary" onClick={() => openEdit(u)} fluidOnMobile={false}>Edit</ActionButton>
                    <ActionButton icon={Trash2} variant="danger" onClick={() => openDel(u)} fluidOnMobile={false}>Delete</ActionButton>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </SectionPanel>

      <SectionPanel
        title="Role Access Matrix"
        description="Click a role tab to view module-level permissions for that role."
        icon={Shield}
        bodyClassName="space-y-5"
        actions={
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
            {(["Admin", "Accountant", "Staff", "Auditor"] as UserRole[]).map((role) => {
              const meta = ROLE_META[role];
              return (
                <button
                  key={role}
                  onClick={() => setActiveRoleTab(role)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${activeRoleTab === role ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"}`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${ROLE_META[activeRoleTab].badgeClass}`}>
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{ROLE_META[activeRoleTab].label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{ROLE_META[activeRoleTab].description} · Level {ROLE_META[activeRoleTab].accessLevel} · {users.filter((u) => u.role === activeRoleTab).length} user(s)</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {PERMISSION_SUMMARY[activeRoleTab].map(({ module, access }) => {
            const isNoAccess = access === "No access";
            return (
              <div key={module} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs ${isNoAccess ? "border-slate-100 bg-slate-50" : `border-slate-200 bg-white`}`}>
                <span className={`font-medium ${isNoAccess ? "text-slate-400" : "text-slate-700"}`}>{module}</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${isNoAccess ? "bg-slate-200 text-slate-400" : `${ROLE_META[activeRoleTab].badgeClass}`}`}>
                  {isNoAccess && <Lock className="mr-1 inline h-3 w-3" />}{access}
                </span>
              </div>
            );
          })}
        </div>
      </SectionPanel>

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-900">{modal === "add" ? "Add New User" : "Edit User"}</h3>
              <button onClick={() => setModal(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <label className="col-span-2 block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Full Name <span className="text-rose-500">*</span></span>
                  <input type="text" placeholder="Enter full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={surfaceInputClassName} />
                </label>
                <label className="col-span-2 block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email Address <span className="text-rose-500">*</span></span>
                  <input type="email" placeholder="user@taxsync.gov.ph" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={surfaceInputClassName} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role <span className="text-rose-500">*</span></span>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))} className={surfaceSelectClassName}>
                    {getRoleOptions(modal, selected?.role).map((r) => <option key={r}>{r}</option>)}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</span>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserStatus }))} className={surfaceSelectClassName}>
                    <option>Active</option><option>Inactive</option><option>Pending</option><option>Suspended</option>
                  </select>
                </label>
                {modal === "add" && (
                  <label className="col-span-2 block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Initial Password <span className="text-rose-500">*</span></span>
                    <input type="password" placeholder="Create initial password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={surfaceInputClassName} />
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-medium"><Lock className="mr-1 inline h-3.5 w-3.5" /> Password Policy</p>
                      <p className="mt-1 text-amber-800">{PASSWORD_HELP_TEXT}</p>
                    </div>
                  </label>
                )}
              </div>
              <div className={`rounded-xl border border-slate-200 p-3 ${ROLE_META[form.role].bgClass}`}>
                <p className={`mb-2 text-xs font-bold ${ROLE_META[form.role].textClass}`}><Shield className="mr-1 inline h-3 w-3" /> {ROLE_META[form.role].label} Permissions Preview:</p>
                <div className="grid grid-cols-2 gap-1">
                  {PERMISSION_SUMMARY[form.role].slice(0, 4).map(({ module, access }) => (
                    <div key={module} className="flex items-center gap-1 text-xs">
                      {access === "No access" ? <Lock className="h-2.5 w-2.5 text-slate-400" /> : <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-current opacity-60" />}
                      <span className={access === "No access" ? "text-slate-400" : ROLE_META[form.role].textClass}>{module}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <ActionButton variant="secondary" onClick={() => setModal(null)}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleSave}>{modal === "add" ? "Create User" : "Save Changes"}</ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modal === "view" && selected && (
        <DetailDialog
          title={selected.name}
          subtitle={selected.email}
          badge={<Pill tone="blue"><Shield className="h-3.5 w-3.5" /> {ROLE_META[selected.role].label} · Level {ROLE_META[selected.role].accessLevel}</Pill>}
          onClose={() => setModal(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setModal(null)}>Close</ActionButton>
              <ActionButton icon={Edit2} variant="primary" onClick={() => openEdit(selected)}>Edit User</ActionButton>
            </div>
          }
        >
          <div className="space-y-5">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold mx-auto ${ROLE_META[selected.role].badgeClass}`}>
              {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-1 sm:px-5">
              <DetailRow label="User ID" value={selected.id} />
              <DetailRow label="Department" value={selected.department} />
              <DetailRow label="Status" value={selected.status} emphasize />
              <DetailRow label="Last Login" value={selected.lastLogin} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Module Access:</p>
              <div className="grid grid-cols-1 gap-1.5">
                {PERMISSION_SUMMARY[selected.role].map(({ module, access }) => (
                  <div key={module} className={`flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs ${access === "No access" ? "border-slate-100 bg-slate-50" : `border-slate-200 bg-white`}`}>
                    <span className={access === "No access" ? "text-slate-400" : "font-medium text-slate-700"}>{module}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${access === "No access" ? "bg-slate-200 text-slate-400" : ROLE_META[selected.role].badgeClass}`}>
                      {access === "No access" ? "No access" : access}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DetailDialog>
      )}

      {/* Delete Modal */}
      {modal === "delete" && selected && (
        <DetailDialog
          title="Remove User?"
          subtitle={selected.name}
          badge={<Pill tone="rose">Destructive action</Pill>}
          onClose={() => setModal(null)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <ActionButton variant="secondary" onClick={() => setModal(null)}>Cancel</ActionButton>
              <ActionButton icon={Trash2} variant="danger" onClick={handleDelete}>Remove User</ActionButton>
            </div>
          }
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <p className="text-sm text-slate-500">This will permanently remove <span className="font-semibold text-slate-900">{selected.name}</span> and revoke all system access.</p>
            <p className="text-xs text-rose-600">This action cannot be undone.</p>
          </div>
        </DetailDialog>
      )}
    </div>
  );
}