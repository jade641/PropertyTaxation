import { Link, useLocation } from "react-router-dom";
import { X, Eye, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRoleConfig } from "../config/roleConfig";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function AccessLevelBar({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= level ? "bg-current opacity-60" : "bg-current opacity-10"
          }`}
        />
      ))}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  if (!user) return null;

  const roleConfig = getRoleConfig(user.role);
  if (!roleConfig) return null;

  const { label, accessLevel, badgeClass, bgClass, textClass, description, modules } = roleConfig;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center justify-between px-5 border-b border-slate-200 flex-shrink-0"
          style={{ backgroundColor: "#0d2137" }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/taxsync-logo.png"
              alt="TaxSync Logo"
              className="h-12 w-auto object-contain bg-white rounded-md p-1.5"
            />
            <div>
              <p className="text-white text-sm font-bold leading-tight">TaxSync</p>
              <p className="text-blue-300 text-[10px] leading-tight mt-0.5">
                Property Tax System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role card */}
        <div className={`px-4 py-3 border-b border-slate-100 ${bgClass}`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${badgeClass}`}
            >
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user.name}
              </p>
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${badgeClass}`}
              >
                {label}
              </span>
            </div>
            <button
              onClick={() => setShowRoleInfo(!showRoleInfo)}
              className={`p-1 rounded-full ${textClass} hover:opacity-70 transition-opacity flex-shrink-0`}
              title="View role permissions"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className={`mt-2.5 ${textClass}`}>
            <AccessLevelBar level={accessLevel} />
            <p className="text-[10px] mt-1 opacity-60">
              Access Level {accessLevel} of 4
            </p>
          </div>

          {/* Read-Only indicator for read-only roles */}
          {accessLevel === 1 && (
            <div className="mt-2.5 flex items-center gap-2 px-2.5 py-2 bg-slate-100 border border-slate-300 rounded-lg">
              <Eye className="h-3.5 w-3.5 text-slate-700 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                  Read-Only Mode
                </p>
                <p className="text-[9px] text-slate-600 leading-tight mt-0.5">
                  View & export only · No modifications
                </p>
              </div>
            </div>
          )}

          {showRoleInfo && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 mb-1.5">
                {label} Permissions:
              </p>
              {description.split(" · ").map((line: string, i: number) => (
                <div key={i} className="flex items-start gap-1.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${textClass} bg-current`}
                  />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest px-3 py-2 font-semibold">
            My Modules ({modules.length})
          </p>
          <div className="space-y-0.5">
            {modules.map((module) => {
              const isActive = location.pathname === module.path;
              const Icon = module.icon;
              const isReadOnly = module.permission === "read";

              return (
                <Link
                  key={module.path}
                  to={module.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  style={isActive ? { backgroundColor: "#0d2137" } : {}}
                >
                  <Icon className="flex-shrink-0" style={{ width: 16, height: 16 }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="leading-tight">{module.name}</p>
                      {isReadOnly && (
                        <span
                          className="flex items-center"
                          title="Read-only access"
                          aria-label="Read-only access"
                        >
                          <Eye
                            className={`h-3 w-3 flex-shrink-0 ${
                              isActive ? "text-blue-300" : "text-slate-400"
                            }`}
                          />
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] leading-tight mt-0.5 ${
                        isActive ? "text-blue-300" : "text-slate-400"
                      }`}
                    >
                      {module.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <p className="px-3 text-[10px] text-slate-300">
            © 2026 TaxSync Davao Region LGU System · v3.1.0
          </p>
        </div>
      </aside>
    </>
  );
}
