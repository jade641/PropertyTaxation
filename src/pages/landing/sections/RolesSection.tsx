import { motion } from 'framer-motion'
import { CheckCircle, LayoutDashboard, Lock, Users } from 'lucide-react'
import { ROLES } from '../data'

export default function RolesSection() {
  return (
    <section id="roles" className="py-24" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5">
            <Users className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
              Role-Based Access Control
            </span>
          </div>
          <h2
            className="mb-4 text-slate-900"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800 }}
          >
            4 User Roles, Precisely Configured
          </h2>
          <p className="mx-auto max-w-xl leading-relaxed text-slate-500">
            Each role has a distinct access level — from full administrative control
            down to read-only auditor visibility.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role, i) => (
            <motion.div
              key={role.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${role.badge}`}>
                  {role.name}
                </span>
                <span className="text-xs font-medium text-slate-400">L{role.level}</span>
              </div>

              <div className="mb-4">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-slate-500">Access Level</span>
                  <span className="font-semibold text-slate-700">{role.level}/4</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`h-2 flex-1 rounded-full ${n <= role.level ? role.bar : 'bg-slate-100'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-3 flex items-center gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">
                  {role.modules} modules accessible
                </span>
              </div>

              <p className="flex-1 text-xs leading-relaxed text-slate-500">{role.desc}</p>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                {role.name === 'Auditor' ? (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                    <Lock className="h-3 w-3" /> Read-Only Mode
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <CheckCircle className="h-3 w-3" /> Data Entry Enabled
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
