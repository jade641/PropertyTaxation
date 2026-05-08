import CrudPage from '../components/CrudPage'
import { AccessDenied } from '../components/RoleGuard'
import { useAuth } from '../context/AuthContext'

const fields = [
  { name: 'provinceId', label: 'Province Id', type: 'int', required: true },
  { name: 'cityCode', label: 'City Code', type: 'text', required: true },
  { name: 'cityName', label: 'City Name', type: 'text', required: true },
  {
    name: 'cityType',
    label: 'City Type',
    type: 'select',
    options: ['City', 'Municipality'],
    required: true,
  },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
]

export default function CitiesPage() {
  const { can, user } = useAuth()

  if (!can('property.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  return (
    <CrudPage
      title="Cities"
      endpoint="/Cities"
      idField="cityId"
      fields={fields}
      canCreate={user?.role === 'Admin'}
      canEdit={user?.role === 'Admin'}
      canDelete={user?.role === 'Admin'}
      readOnlyMessage="Read-only access. City and municipality records are stored in the database."
    />
  )
}
