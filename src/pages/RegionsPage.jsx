import CrudPage from '../components/CrudPage'
import { AccessDenied } from '../components/RoleGuard'
import { useAuth } from '../context/AuthContext'

const fields = [
  { name: 'regionCode', label: 'Region Code', type: 'text', required: true },
  { name: 'regionName', label: 'Region Name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
]

export default function RegionsPage() {
  const { can, user } = useAuth()

  if (!can('property.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  return (
    <CrudPage
      title="Regions"
      endpoint="/Regions"
      idField="regionId"
      fields={fields}
      canCreate={user?.role === 'Admin'}
      canEdit={user?.role === 'Admin'}
      canDelete={user?.role === 'Admin'}
      readOnlyMessage="Read-only access. Geography reference data is maintained by administrators and stored in the database."
    />
  )
}
