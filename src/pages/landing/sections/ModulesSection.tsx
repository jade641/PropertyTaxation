import { motion } from 'framer-motion'
import { LayoutDashboard } from 'lucide-react'
import { COLOR_MAP, MODULES } from '../data'

export default function ModulesSection() {
  return (
    <section id="modules" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5">
            <LayoutDashboard className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              9 Core Modules
            </span>
          </div>
          <h2
            className="mb-4 text-slate-900"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800 }}
          >
            Everything in One Unified Platform
          </h2>
          <p className="mx-auto max-w-xl leading-relaxed text-slate-500">
            From property registration to audit support — TaxSync covers the full
            lifecycle of real property tax administration.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => {
            const Icon = m.icon
            const c = COLOR_MAP[m.color]
            return (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm"
              >
                <div
                  className={`flex-shrink-0 rounded-xl border p-2.5 transition-transform group-hover:scale-105 ${c.bg} ${c.border}`}
                >
                  <Icon className={`h-5 w-5 ${c.text}`} />
                </div>
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <h4 className="text-sm font-bold leading-tight text-slate-900">
                      {m.name}
                    </h4>
                    <span
                      className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${c.badge}`}
                    >
                      M{i + 1}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">{m.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
