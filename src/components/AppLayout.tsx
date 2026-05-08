import { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, Navigate, useNavigate } from "react-router-dom";
import {
  Bell, Search, ChevronDown, LogOut, Settings, User,
  AlertTriangle, CalendarDays, Clock, Menu,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRoleConfig } from "../config/roleConfig";
import { PermissionProvider } from "../context/PermissionContext";
import Sidebar from "./Sidebar";

// ─── Nav item definitions ────────────────────────────────────────────────────
// Navigation is now handled by roleConfig.ts

const NOTIFICATIONS = [
  { id: 1, title: "Q1 RPT Payment Due",         desc: "1st quarter deadline: March 31 — 247 properties unpaid", type: "deadline", time: "Overdue" },
  { id: 2, title: "Annual Report Due",           desc: "Annual property tax report due April 30, 2026",          type: "deadline", time: "30 days" },
  { id: 3, title: "Delinquency Notice",          desc: "38 properties flagged for non-payment in Brgy. Sta. Ana",type: "overdue",  time: "Urgent"  },
  { id: 4, title: "New Properties Registered",  desc: "12 new property records added this week",                type: "info",     time: "Just now"},
];

function AccessLevelBar({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= level ? "bg-current opacity-60" : "bg-current opacity-10"}`} />
      ))}
    </div>
  );
}

export default function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu]   = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const notifRef    = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const roleConfig = getRoleConfig(user!.role);
  if (!roleConfig) return <Navigate to="/login" replace />;

  const urgentCount = NOTIFICATIONS.filter((n) => n.type === "overdue").length;

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <PermissionProvider currentPath={location.pathname}>
      <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
        {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* ── Main Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-20">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search properties, taxpayers, payments..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:bg-white" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="h-5 w-5" />
                {urgentCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    <span className="text-[10px] text-white bg-red-500 px-2 py-0.5 rounded-full font-bold">{urgentCount} urgent</span>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                    {NOTIFICATIONS.map((n) => (
                      <div key={n.id} className={`p-3.5 hover:bg-slate-50 transition-colors ${n.type === "overdue" ? "border-l-2 border-l-red-400" : ""}`}>
                        <div className="flex gap-3">
                          <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${n.type === "overdue" ? "bg-red-100 text-red-600" : n.type === "deadline" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                            {n.type === "overdue"  ? <AlertTriangle className="h-3.5 w-3.5" /> :
                             n.type === "deadline" ? <CalendarDays  className="h-3.5 w-3.5" /> :
                                                     <Clock         className="h-3.5 w-3.5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 leading-tight">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                            <p className={`text-xs mt-1 font-medium ${n.type === "overdue" ? "text-red-600" : "text-slate-400"}`}>{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all notifications →</button>
                  </div>
                </div>
              )}
            </div>

            {/* Role badge */}
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${roleConfig.badgeClass}`}>
              <Shield className="h-3 w-3" />
              {roleConfig.label}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                className="flex items-center gap-2.5 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${roleConfig.badgeClass}`}>
                  {user!.initials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700 leading-tight">{user!.name}</p>
                  <p className="text-[10px] text-slate-400">{user!.department}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className={`p-4 border-b border-slate-100 ${roleConfig.bgClass}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${roleConfig.badgeClass}`}>
                        {user!.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user!.name}</p>
                        <p className="text-xs text-slate-500">{user!.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleConfig.badgeClass}`}>
                          {roleConfig.label}
                        </span>
                      </div>
                    </div>
                    <div className={`mt-3 ${roleConfig.textClass}`}>
                      <div className="flex justify-between text-[10px] mb-1 opacity-70">
                        <span>Access Level</span><span>{roleConfig.accessLevel}/4</span>
                      </div>
                      <AccessLevelBar level={roleConfig.accessLevel} />
                    </div>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                      <User className="h-4 w-4 text-slate-400" /> My Profile
                    </button>
                    {user!.role === "Admin" && (
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                        <Settings className="h-4 w-4 text-slate-400" /> System Settings
                      </button>
                    )}
                    <div className="mx-2 my-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Your Access</p>
                      <p className="text-xs text-slate-600 leading-snug">{roleConfig.description}</p>
                    </div>
                    <div className="border-t border-slate-100 my-1" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          <Outlet />
        </main>
        </div>
      </div>
    </PermissionProvider>
  );
}