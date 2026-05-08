import { motion } from 'framer-motion'
import { ChevronDown, Globe } from 'lucide-react'
import GridPattern from './GridPattern'

export default function Hero() {
  return (
    <section
      className="relative flex min-h-screen flex-col justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #0d1b2a 0%, #0d2137 45%, #0f2d4a 75%, #112040 100%)',
      }}
    >
      <GridPattern opacity={0.06} />

      <div
        className="absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          transform: 'translateX(30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      <div
        className="absolute left-0 right-0 top-0 h-1"
        style={{ backgroundColor: '#2563eb' }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{
                backgroundColor: 'rgba(37,99,235,0.18)',
                border: '1px solid rgba(96,165,250,0.25)',
              }}
            >
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-300">
                Republic of the Philippines · Local Government Unit · Davao Region
              </span>
            </div>

            <h1
              className="mb-5 leading-tight text-white"
              style={{
                fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
              }}
            >
              Property Taxation &
              <br />
              <span style={{ color: '#60a5fa' }}>Compliance Reporting</span>
              <br />
              System
            </h1>

            <p
              className="mb-8 max-w-[52ch] text-lg leading-relaxed"
              style={{ color: '#93b8d8' }}
            >
              A comprehensive enterprise platform for local government units —
              streamlining real property tax administration, compliance monitoring,
              and official government reporting.
            </p>

            <div className="mb-10 flex flex-wrap gap-3">
              <a
                href="#modules"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all"
                style={{
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                Explore Modules
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="mr-1 self-center text-xs text-slate-400">
                4 Role Types:
              </span>
              {['Admin', 'Accountant', 'Staff Encoder', 'Auditor'].map((r) => (
                <span
                  key={r}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="hidden lg:block"
          >
            <div
              className="overflow-hidden rounded-2xl shadow-2xl"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                <div
                  className="mx-4 flex h-6 flex-1 items-center rounded-md px-3"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="text-[11px]" style={{ color: '#64748b' }}>
                    app.taxsync.gov.ph/dashboard
                  </span>
                </div>
              </div>

              <div className="p-5" style={{ backgroundColor: '#f8fafc' }}>
                <div className="mb-3 grid grid-cols-4 gap-2">
                  {[
                    {
                      label: 'Properties',
                      value: '3,847',
                      sub: '+142 this qtr',
                      color: 'text-blue-600',
                      bg: 'bg-blue-50',
                    },
                    {
                      label: 'Tax YTD',
                      value: '₱16.84M',
                      sub: '+8.4% vs last',
                      color: 'text-emerald-600',
                      bg: 'bg-emerald-50',
                    },
                    {
                      label: 'Pending',
                      value: '1,006',
                      sub: '272 past due',
                      color: 'text-amber-600',
                      bg: 'bg-amber-50',
                    },
                    {
                      label: 'Compliance',
                      value: '73.8%',
                      sub: 'Target: 85%',
                      color: 'text-blue-600',
                      bg: 'bg-blue-50',
                    },
                  ].map((k) => (
                    <div key={k.label} className={`${k.bg} rounded-lg p-2.5`}>
                      <p className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
                        {k.label}
                      </p>
                      <p className={`mt-0.5 text-sm font-bold ${k.color}`}>
                        {k.value}
                      </p>
                      <p className="mt-0.5 text-[9px] text-slate-400">{k.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-2 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-[10px] font-semibold text-slate-600">
                    Monthly Tax Collection — 2026
                  </p>
                  <div className="relative flex h-16 items-end gap-1.5">
                    {[75, 51, 84, 26, 70, 50, 91].map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: `${h}%`,
                            backgroundColor: '#0d2137',
                          }}
                        />
                        <span className="text-[8px] text-slate-400">
                          {['J', 'F', 'M', 'A', 'M', 'J', 'J'][i]}
                        </span>
                      </div>
                    ))}
                    <div
                      className="pointer-events-none absolute left-0 w-full"
                      style={{
                        bottom: '38px',
                        borderTop: '1.5px dashed #f97316',
                        opacity: 0.5,
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-center">
                    <p className="text-[9px] font-semibold text-emerald-600">
                      COMPLIANT
                    </p>
                    <p className="text-sm font-bold text-emerald-700">2,841</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-center">
                    <p className="text-[9px] font-semibold text-amber-600">
                      LATE
                    </p>
                    <p className="text-sm font-bold text-amber-700">272</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-red-200 bg-red-50 p-2 text-center">
                    <p className="text-[9px] font-semibold text-red-600">
                      UNPAID
                    </p>
                    <p className="text-sm font-bold text-red-700">734</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <a
            href="#features"
            className="flex flex-col items-center gap-2 opacity-40 transition-opacity hover:opacity-70"
          >
            <span className="text-[11px] uppercase tracking-widest text-white">
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-5 w-5 text-white" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
