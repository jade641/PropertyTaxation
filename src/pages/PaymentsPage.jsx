import CrudPage from '../components/CrudPage'
import { AccessDenied } from '../components/RoleGuard'
import { useAuth } from '../context/AuthContext'

const fields = [
  { name: 'assessmentId', label: 'Assessment Id', type: 'int', required: true },
  { name: 'payerId', label: 'Payer Id', type: 'int', required: true },
  { name: 'paymentReference', label: 'Payment Reference', type: 'text', required: true },
  {
    name: 'paymentMethod',
    label: 'Payment Method',
    type: 'select',
    options: ['Cash', 'Check', 'BankTransfer', 'CreditCard', 'DebitCard', 'Gcash', 'Paymaya', 'Online'],
    required: true,
  },
  { name: 'amountPaid', label: 'Amount Paid', type: 'number', required: true },
  { name: 'paymentDate', label: 'Payment Date', type: 'datetime-local' },
  { name: 'transactionId', label: 'Transaction Id', type: 'text' },
  { name: 'bankName', label: 'Bank Name', type: 'text' },
  { name: 'checkNumber', label: 'Check Number', type: 'text' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Pending', 'Completed', 'Failed', 'Refunded', 'Cancelled'],
  },
  { name: 'receiptNumber', label: 'Receipt Number', type: 'text' },
  { name: 'processedBy', label: 'Processed By', type: 'int' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
  { name: 'updatedAt', label: 'Updated At', type: 'datetime-local', inForm: false },
]

export default function PaymentsPage() {
  const { can, user } = useAuth()

  if (!can('payment.view')) {
    return <AccessDenied requiredRole="Admin, Accountant, Staff, or Auditor" />
  }

  return (
    <CrudPage
      title="Payments"
      endpoint="/Payments"
      idField="paymentId"
      fields={fields}
      canCreate={can('payment.create')}
      canEdit={can('payment.edit')}
      canDelete={user?.role === 'Admin'}
      readOnlyMessage="Read-only access. Payment activity is stored in the database and reflected across reports and compliance."
    />
  )
}
