import CrudPage from '../components/CrudPage'
import { AccessDenied } from '../components/RoleGuard'
import { useAuth } from '../context/AuthContext'

const fields = [
  { name: 'ownerId', label: 'Owner Id', type: 'int', required: true },
  {
    name: 'propertyType',
    label: 'Property Type',
    type: 'select',
    options: ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'MixedUse'],
    required: true,
  },
  { name: 'propertyNumber', label: 'Property Number', type: 'text' },
  { name: 'titleNumber', label: 'Title Number', type: 'text' },
  { name: 'addressLine1', label: 'Address Line 1', type: 'text', required: true },
  { name: 'addressLine2', label: 'Address Line 2', type: 'text' },
  { name: 'regionId', label: 'Region Id', type: 'int', required: true },
  { name: 'provinceId', label: 'Province Id', type: 'int', required: true },
  { name: 'cityId', label: 'City Id', type: 'int', required: true },
  { name: 'barangayId', label: 'Barangay Id', type: 'int', required: true },
  { name: 'postalCode', label: 'Postal Code', type: 'text' },
  { name: 'lotArea', label: 'Lot Area', type: 'number' },
  { name: 'floorArea', label: 'Floor Area', type: 'number' },
  { name: 'marketValue', label: 'Market Value', type: 'number' },
  { name: 'assessedValue', label: 'Assessed Value', type: 'number' },
  { name: 'yearAcquired', label: 'Year Acquired', type: 'int' },
  { name: 'registrationDate', label: 'Registration Date', type: 'date' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Inactive', 'Pending', 'Archived'],
  },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
  { name: 'updatedAt', label: 'Updated At', type: 'datetime-local', inForm: false },
]

export default function PropertiesPage() {
  const { can } = useAuth()

  if (!can('property.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  return (
    <CrudPage
      title="Properties"
      endpoint="/Properties"
      idField="propertyId"
      fields={fields}
      canCreate={can('property.create')}
      canEdit={can('property.edit')}
      canDelete={can('property.delete')}
      readOnlyMessage="Read-only access. Property records are loaded from and saved to the database."
    />
  )
}
