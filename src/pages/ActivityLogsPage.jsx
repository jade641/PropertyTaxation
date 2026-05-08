import CrudPage from '../components/CrudPage'

const fields = [
  { name: 'userId', label: 'User Id', type: 'int' },
  { name: 'action', label: 'Action', type: 'text', required: true },
  { name: 'module', label: 'Module', type: 'text', required: true },
  {
    name: 'severity',
    label: 'Severity',
    type: 'select',
    options: ['Info', 'Warning', 'Critical'],
  },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'ipAddress', label: 'IP Address', type: 'text' },
  { name: 'userAgent', label: 'User Agent', type: 'textarea' },
  { name: 'createdAt', label: 'Created At', type: 'datetime-local', inForm: false },
]

export default function ActivityLogsPage() {
  return <CrudPage title="Activity Logs" endpoint="/ActivityLogs" idField="logId" fields={fields} />
}
