import CrudPage from '../components/CrudPage'

const fields = [
  { name: 'userName', label: 'User Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'text', required: true },
  { name: 'passwordHash', label: 'Password Hash', type: 'text', required: true },
  { name: 'firstName', label: 'First Name', type: 'text', required: true },
  { name: 'lastName', label: 'Last Name', type: 'text', required: true },
  { name: 'phoneNumber', label: 'Phone Number', type: 'text' },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    options: ['Admin', 'Accountant', 'Auditor', 'Staff', 'Taxpayer', 'TaxOfficer'],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Inactive', 'Suspended', 'Pending'],
  },
  { name: 'emailConfirmed', label: 'Email Confirmed', type: 'boolean' },
  { name: 'phoneNumberConfirmed', label: 'Phone Confirmed', type: 'boolean' },
  { name: 'twoFactorEnabled', label: 'Two Factor Enabled', type: 'boolean' },
  { name: 'lockoutEnd', label: 'Lockout End', type: 'datetime-local' },
  { name: 'lockoutEnabled', label: 'Lockout Enabled', type: 'boolean' },
  { name: 'accessFailedCount', label: 'Access Failed Count', type: 'int' },
  { name: 'profileImage', label: 'Profile Image', type: 'text' },
  { name: 'securityStamp', label: 'Security Stamp', type: 'text' },
  { name: 'concurrencyStamp', label: 'Concurrency Stamp', type: 'text' },
  { name: 'normalizedUserName', label: 'Normalized User Name', type: 'text' },
  { name: 'normalizedEmail', label: 'Normalized Email', type: 'text' },
  { name: 'lastLogin', label: 'Last Login', type: 'datetime-local' },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
  { name: 'updatedAt', label: 'Updated At', type: 'datetime-local', inForm: false },
]

export default function UsersPage() {
  return <CrudPage title="Users" endpoint="/Users" idField="id" fields={fields} />
}
