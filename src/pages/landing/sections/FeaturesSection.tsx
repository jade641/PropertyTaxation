import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { COLOR_MAP, HIGHLIGHTS } from '../data'

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Platform Features
            </span>
          </div>
          <h2
            className="mb-4 text-slate-900"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800 }}
          >
            Built for Davao Region LGUs
            <br />
            Property Tax Administration
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-slate-500">
            Every feature is designed around the workflows of treasurers, assessors,
            accountants, and internal auditors across the Davao Region.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((f) => {
            const Icon = f.icon
            const c = COLOR_MAP[f.color]
            return (
              <motion.div
                key={f.title}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.22 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`mb-4 inline-flex rounded-xl border p-3 ${c.bg} ${c.border}`}>
                  <Icon className={`h-5 w-5 ${c.text}`} />
                </div>
                <h3
                  className="mb-2 text-slate-900"
                  style={{ fontSize: '0.95rem', fontWeight: 700 }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
