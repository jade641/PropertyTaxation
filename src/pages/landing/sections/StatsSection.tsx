import Counter from '../components/Counter'
import { STATS } from '../data'

export default function StatsSection() {
  return (
    <section
      className="border-b border-slate-200 py-16"
      style={{ backgroundColor: '#0d2137' }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="text-center">
                <div
                  className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.colorClass}`}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p
                  className="mb-1 text-white"
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                  }}
                >
                  <Counter to={s.value} prefix={s.prefix} suffix={s.suffix} />
                </p>
                <p className="text-sm" style={{ color: '#6b93b8' }}>
                  {s.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
