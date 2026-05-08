import { useState } from 'react'

const cx = (...parts) => parts.filter(Boolean).join(' ')

export default function ModuleTabsPage({ title, description, tabs, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab ?? tabs[0]?.id)
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]

  if (!active) {
    return null
  }

  const ActiveComponent = active.component

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-6">
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.12),_transparent_38%),linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(255,255,255,1))]" />
        <div className="relative px-5 py-6 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 backdrop-blur">
            Database Workspace
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.3rem]">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'} available
            </span>
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              Active: {active.label}
            </span>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cx(
                  'inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200',
                  active.id === tab.id
                    ? 'border border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white">
          <ActiveComponent />
        </div>
      </section>
    </div>
  )
}