import { CheckCircle, History, Lock, Shield, Users, Zap } from 'lucide-react'
import GridPattern from '../components/GridPattern'

export default function AboutSection() {
  return (
    <section id="about" className="border-t border-slate-200 bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Legal Framework
              </span>
            </div>
            <h2
              className="mb-5 text-slate-900"
              style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800 }}
            >
              Built on the Local
              <br />
              Government Code of 1991
            </h2>
            <p className="mb-6 leading-relaxed text-slate-500">
              TaxSync is designed for Davao Region LGU workflows and supports
              Davao del Sur, Davao del Norte, Davao de Oro, Davao Oriental,
              Davao Occidental, and Davao City with audit-friendly reporting,
              role-based access, and secure record-keeping.
            </p>

            <div className="space-y-3">
              {[
                'R.A. 7160 — Local Government Code of 1991',
                'BLGF circulars on real property tax rates',
                'COA-aligned audit trail & reporting',
                'Data Privacy Act compliance (R.A. 10173)',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
            style={{ backgroundColor: '#0d2137' }}
          >
            <GridPattern opacity={0.05} />
            <div className="relative z-10 p-8">
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="rounded-xl p-2.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  <Lock className="h-5 w-5 text-blue-300" />
                </div>
                <h3 className="text-white" style={{ fontWeight: 700 }}>
                  Secure Government Portal
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Encryption', value: 'TLS (HTTPS)', icon: Shield },
                  { label: 'Access', value: 'Authorized Davao Region LGU personnel only', icon: Users },
                  { label: 'Audit Trail', value: 'Tamper-evident logs', icon: History },
                  { label: 'Availability', value: '99.9% uptime target', icon: Zap },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl p-3"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      <div
                        className="flex-shrink-0 rounded-lg p-1.5"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                      >
                        <Icon className="h-3.5 w-3.5 text-blue-300" />
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: '#6b93b8' }}>
                          {item.label}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div
                className="mt-6 rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <p className="text-xs leading-relaxed" style={{ color: '#4a7fa5' }}>
                  Unauthorized access is prohibited. All access attempts may be logged
                  and monitored.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
