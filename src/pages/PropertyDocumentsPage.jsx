import CrudPage from '../components/CrudPage'
import { AccessDenied } from '../components/RoleGuard'
import { useAuth } from '../context/AuthContext'

const fields = [
  { name: 'propertyId', label: 'Property Id', type: 'int', required: true },
  {
    name: 'documentType',
    label: 'Document Type',
    type: 'select',
    options: ['Title', 'TaxDeclaration', 'DeedOfSale', 'SurveyPlan', 'Other'],
    required: true,
  },
  { name: 'documentName', label: 'Document Name', type: 'text', required: true },
  { name: 'filePath', label: 'File Path', type: 'text', required: true },
  { name: 'fileSize', label: 'File Size', type: 'int' },
  { name: 'uploadedBy', label: 'Uploaded By', type: 'int' },
  { name: 'uploadedAt', label: 'Uploaded At', type: 'datetime-local', inForm: false },
]

export default function PropertyDocumentsPage() {
  const { can } = useAuth()

  if (!can('filing.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, or Staff" />
  }

  return (
    <CrudPage
      title="Property Documents"
      endpoint="/PropertyDocuments"
      idField="documentId"
      fields={fields}
      canCreate={can('filing.upload')}
      canEdit={can('filing.delete')}
      canDelete={can('filing.delete')}
      readOnlyMessage="Read-only access. Filing entries below are database-backed document records."
    />
  )
}
