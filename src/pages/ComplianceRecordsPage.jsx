import CrudPage from '../components/CrudPage'
import { AccessDenied } from '../components/RoleGuard'
import { useAuth } from '../context/AuthContext'

const fields = [
  { name: 'propertyId', label: 'Property Id', type: 'int', required: true },
  { name: 'assessmentId', label: 'Assessment Id', type: 'int' },
  { name: 'caseNumber', label: 'Case Number', type: 'text', required: true },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Pending', 'Compliant', 'Late', 'Unpaid', 'UnderReview', 'Resolved'],
    required: true,
  },
  { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
  { name: 'reviewedAt', label: 'Reviewed At', type: 'datetime-local' },
  { name: 'reviewedBy', label: 'Reviewed By', type: 'int' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
  { name: 'updatedAt', label: 'Updated At', type: 'datetime-local', inForm: false },
]

export default function ComplianceRecordsPage() {
  const { can, user } = useAuth()

  if (!can('compliance.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  return (
    <CrudPage
      title="Compliance Records"
      endpoint="/ComplianceRecords"
      idField="complianceRecordId"
      fields={fields}
      canCreate={can('compliance.update')}
      canEdit={can('compliance.update')}
      canDelete={user?.role === 'Admin'}
      readOnlyMessage="Read-only access. Compliance records are persisted in the compliance_records table."
    />
  )
}