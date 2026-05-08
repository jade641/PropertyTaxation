import { Navigate, NavLink, Route, Routes, Outlet } from 'react-router-dom'
import ActivityLogsPage from './pages/ActivityLogsPage'
import BarangaysPage from './pages/BarangaysPage'
import CitiesPage from './pages/CitiesPage'
import PaymentsPage from './pages/PaymentsPage'
import PropertiesPage from './pages/PropertiesPage'
import PropertyDocumentsPage from './pages/PropertyDocumentsPage'
import ProvincesPage from './pages/ProvincesPage'
import RegionsPage from './pages/RegionsPage'
import TaxAssessmentsPage from './pages/TaxAssessmentsPage'
import TaxRatesPage from './pages/TaxRatesPage'
import UsersPage from './pages/UsersPage'
import Login from './pages/Login'
import Register from './pages/Register'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/regions', label: 'Regions' },
  { to: '/provinces', label: 'Provinces' },
  { to: '/cities', label: 'Cities' },
  { to: '/barangays', label: 'Barangays' },
  { to: '/properties', label: 'Properties' },
  { to: '/property-documents', label: 'Property Documents' },
  { to: '/tax-assessments', label: 'Tax Assessments' },
  { to: '/tax-rates', label: 'Tax Rates' },
  { to: '/payments', label: 'Payments' },
  { to: '/activity-logs', label: 'Activity Logs' },
  { to: '/users', label: 'Users' },
]

function Layout() {
  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <nav style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                color: isActive ? 'var(--text-h)' : 'var(--text)',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  )
}

function Dashboard() {
  return (
    <div style={{ padding: '24px' }}>
      <h2>TaxSync Dashboard</h2>
      <p>Select a module to manage records:</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
        {navLinks
          .filter((link) => link.to !== '/dashboard')
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                textDecoration: 'none',
                color: 'var(--text-h)',
                backgroundColor: 'transparent',
              }}
            >
              {link.label}
            </NavLink>
          ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/regions" element={<RegionsPage />} />
        <Route path="/provinces" element={<ProvincesPage />} />
        <Route path="/cities" element={<CitiesPage />} />
        <Route path="/barangays" element={<BarangaysPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/property-documents" element={<PropertyDocumentsPage />} />
        <Route path="/tax-assessments" element={<TaxAssessmentsPage />} />
        <Route path="/tax-rates" element={<TaxRatesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/activity-logs" element={<ActivityLogsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
