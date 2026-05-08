import CrudPage from '../components/CrudPage'
import { AccessDenied } from '../components/RoleGuard'
import { useAuth } from '../context/AuthContext'

const fields = [
  { name: 'cityId', label: 'City Id', type: 'int', required: true },
  { name: 'barangayCode', label: 'Barangay Code', type: 'text', required: true },
  { name: 'barangayName', label: 'Barangay Name', type: 'text', required: true },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
]

export default function BarangaysPage() {
  const { can, user } = useAuth()

  if (!can('property.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  return (
    <CrudPage
      title="Barangays"
      endpoint="/Barangays"
      idField="barangayId"
      fields={fields}
      canCreate={user?.role === 'Admin'}
      canEdit={user?.role === 'Admin'}
      canDelete={user?.role === 'Admin'}
      readOnlyMessage="Read-only access. Barangay records are stored in the database."
    />
  )
}
