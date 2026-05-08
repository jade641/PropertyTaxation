export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-3 ml-12">
            <img 
              src="/taxsync-logo.png" 
              alt="TaxSync Logo" 
              className="h-12 w-auto object-contain rounded-md bg-white" 
            />
            <div>
              <p className="text-sm font-bold leading-none text-slate-900">TaxSync</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Property Tax & Compliance Reporting System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8 text-sm text-slate-500 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="transition-colors hover:text-slate-900">
              Features
            </a>
            <a href="#modules" className="transition-colors hover:text-slate-900">
              Modules
            </a>
            <a href="#roles" className="transition-colors hover:text-slate-900">
              Roles
            </a>
            <a href="#about" className="transition-colors hover:text-slate-900">
              Legal
            </a>
          </div>

          <p className="text-xs text-slate-500">
            © 2026 Republic of the Philippines · Davao Region LGU Division
          </p>
        </div>
      </div>
    </footer>
  )
}
