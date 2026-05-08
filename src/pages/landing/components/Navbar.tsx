import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

type NavbarProps = {
  onSignIn: () => void
}

const NAV_LINKS = ['Features', 'Modules', 'Roles', 'About'] as const

export default function Navbar({ onSignIn }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3 ml-12">
          <img src="/taxsync-logo.png" alt="TaxSync Logo" className="h-20 w-auto object-contain rounded-md bg-white p-2" />
        </div>

        <nav className="hidden absolute left-1/2 -translate-x-1/2 items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className={`text-sm font-medium transition-colors hover:opacity-70 ${
                scrolled ? 'text-slate-600' : 'text-white/80'
              }`}
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={onSignIn}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              scrolled
                ? 'bg-slate-900 text-white hover:bg-slate-700'
                : 'bg-white/15 text-white border border-white/25 hover:bg-white/25 backdrop-blur-sm'
            }`}
          >
            Sign In to Portal
          </button>
        </div>

        <button
          type="button"
          className={`rounded-lg p-2 md:hidden ${
            scrolled ? 'text-slate-600' : 'text-white'
          }`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-slate-200 bg-white px-6 py-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="block py-1 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {link}
            </a>
          ))}
          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={onSignIn}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Sign In to Portal
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
