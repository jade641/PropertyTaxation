import { ArrowRight, Lock, Zap } from 'lucide-react'
import GridPattern from '../components/GridPattern'

type CtaBannerProps = {
  onSignIn: () => void
}

export default function CtaBanner({ onSignIn }: CtaBannerProps) {
  return (
    <section
      className="relative overflow-hidden py-20"
      style={{
        background:
          'linear-gradient(135deg, #0d1b2a 0%, #0d2137 60%, #112040 100%)',
      }}
    >
      <GridPattern opacity={0.05} />
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{
            backgroundColor: 'rgba(37,99,235,0.2)',
            border: '1px solid rgba(96,165,250,0.2)',
          }}
        >
          <Zap className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-300">
            Ready to Get Started?
          </span>
        </div>

        <h2
          className="mb-4 text-white"
          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800 }}
        >
          Access the TaxSync Portal
        </h2>
        <p
          className="mb-8 leading-relaxed"
          style={{ color: '#93b8d8', fontSize: '1.0625rem' }}
        >
          Use your authorized Davao Region LGU credentials to sign in. Serving
          Davao del Sur, Davao del Norte, Davao de Oro, Davao Oriental,
          Davao Occidental, and Davao City.
        </p>

        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{
            backgroundColor: '#2563eb',
            boxShadow: '0 4px 24px rgba(37,99,235,0.4)',
          }}
        >
          <Lock className="h-4 w-4" />
          Sign In to Portal
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="mt-6 text-xs" style={{ color: '#4a7fa5' }}>
          For authorized Davao Region LGU personnel only · © 2026 TaxSync
        </p>
      </div>
    </section>
  )
}
