import CrudPage from '../components/CrudPage'
import { AccessDenied } from '../components/RoleGuard'
import { useAuth } from '../context/AuthContext'

const fields = [
  { name: 'propertyId', label: 'Property Id', type: 'int', required: true },
  { name: 'taxYear', label: 'Tax Year', type: 'int', required: true },
  { name: 'quarter', label: 'Quarter', type: 'int' },
  { name: 'assessedValue', label: 'Assessed Value', type: 'number', required: true },
  { name: 'taxRate', label: 'Tax Rate', type: 'number', required: true },
  { name: 'basicTax', label: 'Basic Tax', type: 'number', required: true },
  { name: 'sefTax', label: 'SEF Tax', type: 'number' },
  { name: 'penalties', label: 'Penalties', type: 'number' },
  { name: 'discounts', label: 'Discounts', type: 'number' },
  { name: 'totalAmount', label: 'Total Amount', type: 'number', required: true },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Pending', 'Approved', 'Paid', 'Overdue', 'Cancelled'],
  },
  { name: 'assessedBy', label: 'Assessed By', type: 'int' },
  { name: 'approvedBy', label: 'Approved By', type: 'int' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
  { name: 'updatedAt', label: 'Updated At', type: 'datetime-local', inForm: false },
]

export default function TaxAssessmentsPage() {
  const { can } = useAuth()

  if (!can('tax.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  return (
    <CrudPage
      title="Tax Assessments"
      endpoint="/TaxAssessments"
      idField="assessmentId"
      fields={fields}
      canCreate={can('tax.create')}
      canEdit={can('tax.edit')}
      canDelete={can('tax.delete')}
      readOnlyMessage="Read-only access. Tax assessments here are loaded from the database."
    />
  )
}
