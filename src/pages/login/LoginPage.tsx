import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-3 text-slate-600">
        This is a placeholder route. Replace it with your real authentication UI.
      </p>

      <div className="mt-8">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Back to landing
        </Link>
      </div>
    </main>
  )
}
