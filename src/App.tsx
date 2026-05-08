import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/landing/LandingPage'
import Login from './Login'
import Dashboard from './pages/Dashboard.tsx'
import Audit from './pages/Audit.tsx'
import PropertyRegistration from './pages/PropertyRegistration.tsx'
import TaxCalculation from './pages/TaxCalculation.tsx'
import PaymentManagement from './pages/PaymentManagement.tsx'
import Compliance from './pages/Compliance.tsx'
import Filing from './pages/Filing.tsx'
import Reporting from './pages/Reporting.tsx'
import Users from './pages/Users'
import PropertyRegistryWorkspace from './pages/data/PropertyRegistryWorkspace'
import TaxCalculationWorkspace from './pages/data/TaxCalculationWorkspace'
import DashboardDataPage from './pages/data/DashboardDataPage'
import AuditDataPage from './pages/data/AuditDataPage'
import UsersManagementPage from './pages/data/UsersManagementPage'
import PaymentsPage from './pages/PaymentsPage'
import ComplianceRecordsPage from './pages/ComplianceRecordsPage'
import PropertyDocumentsPage from './pages/PropertyDocumentsPage'
import ReportRecordsPage from './pages/ReportRecordsPage'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="property-registration" element={<PropertyRegistration />} />
          <Route path="property-registration/manage" element={<PropertyRegistryWorkspace />} />
          <Route path="tax-calculation" element={<TaxCalculation />} />
          <Route path="tax-calculation/manage" element={<TaxCalculationWorkspace />} />
          <Route path="payment-management" element={<PaymentManagement />} />
          <Route path="payment-management/manage" element={<PaymentsPage />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="compliance/manage" element={<ComplianceRecordsPage />} />
          <Route path="filing" element={<Filing />} />
          <Route path="filing/manage" element={<PropertyDocumentsPage />} />
          <Route path="reporting" element={<Reporting />} />
          <Route path="reporting/manage" element={<ReportRecordsPage />} />
          <Route path="audit" element={<Audit />} />
          <Route path="users" element={<Users />} />
          <Route path="dashboard/manage" element={<DashboardDataPage />} />
          <Route path="audit/manage" element={<AuditDataPage />} />
          <Route path="users/manage" element={<UsersManagementPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
