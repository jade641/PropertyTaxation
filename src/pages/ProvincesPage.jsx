import CrudPage from '../components/CrudPage'
import { AccessDenied } from '../components/RoleGuard'
import { useAuth } from '../context/AuthContext'

const fields = [
  { name: 'regionId', label: 'Region Id', type: 'int', required: true },
  { name: 'provinceCode', label: 'Province Code', type: 'text', required: true },
  { name: 'provinceName', label: 'Province Name', type: 'text', required: true },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
]

export default function ProvincesPage() {
  const { can, user } = useAuth()

  if (!can('property.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  return (
    <CrudPage
      title="Provinces"
      endpoint="/Provinces"
      idField="provinceId"
      fields={fields}
      canCreate={user?.role === 'Admin'}
      canEdit={user?.role === 'Admin'}
      canDelete={user?.role === 'Admin'}
      readOnlyMessage="Read-only access. Province records are stored in the database."
    />
  )
}
