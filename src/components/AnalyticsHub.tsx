import { Fragment, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.tsx';
import { Button } from './ui/button.tsx';
import { Badge } from './ui/badge.tsx';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import { 
  FileText, 
  Users,
  Activity,
  TrendingUp,
  Filter,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';

interface StaffActivity {
  id: string;
  staff: string;
  role: string;
  patientsServed: number;
  hoursWorked: number;
  status: 'active' | 'break' | 'completed';
  date: string;
}

interface PatientVisit {
  id: string;
  patientName: string;
  service: string;
  dentist: string;
  time: string;
  status: 'completed' | 'cancelled' | 'in-progress';
  revenue: number;
}

const reportTypes = [
  { id: 'staff-activity', name: 'Staff Activity Logs', icon: Users },
  { id: 'patient-visits', name: 'Patient Visit Summaries', icon: Activity },
  { id: 'efficiency', name: 'Efficiency Reports', icon: TrendingUp },
  { id: 'revenue', name: 'Revenue Analytics', icon: FileText }
];

const staffActivities: StaffActivity[] = [
  { id: '1', staff: 'Dr. Jade', role: 'Dentist', patientsServed: 12, hoursWorked: 8, status: 'active', date: '2025-09-15' },
  { id: '2', staff: 'Maria Santos', role: 'Receptionist', patientsServed: 25, hoursWorked: 8, status: 'active', date: '2025-09-15' },
  { id: '3', staff: 'Dr. Cruz', role: 'Dentist', patientsServed: 10, hoursWorked: 7, status: 'completed', date: '2025-09-15' },
  { id: '4', staff: 'Ana Reyes', role: 'Assistant', patientsServed: 15, hoursWorked: 8, status: 'break', date: '2025-09-15' }
];

const patientVisits: PatientVisit[] = [
  { id: '1', patientName: 'Maria Rodriguez', service: 'Teeth Cleaning', dentist: 'Dr. Jade', time: '9:00 AM', status: 'completed', revenue: 500 },
  { id: '2', patientName: 'Juan Santos', service: 'Root Canal', dentist: 'Dr. Jade', time: '10:30 AM', status: 'completed', revenue: 3000 },
  { id: '3', patientName: 'Ana Dela Cruz', service: 'Consultation', dentist: 'Dr. Cruz', time: '2:00 PM', status: 'in-progress', revenue: 300 },
  { id: '4', patientName: 'Carlos Martinez', service: 'Tooth Filling', dentist: 'Dr. Jade', time: '3:30 PM', status: 'cancelled', revenue: 0 }
];

// Heatmap data - hours (8 AM to 6 PM) x days of week
const heatmapData = [
  { hour: '8 AM', mon: 3, tue: 4, wed: 2, thu: 5, fri: 4, sat: 2 },
  { hour: '9 AM', mon: 5, tue: 6, wed: 7, thu: 6, fri: 5, sat: 3 },
  { hour: '10 AM', mon: 7, tue: 8, wed: 6, thu: 7, fri: 6, sat: 4 },
  { hour: '11 AM', mon: 6, tue: 5, wed: 5, thu: 6, fri: 7, sat: 3 },
  { hour: '12 PM', mon: 4, tue: 3, wed: 4, thu: 3, fri: 4, sat: 2 },
  { hour: '1 PM', mon: 5, tue: 6, wed: 5, thu: 6, fri: 5, sat: 3 },
  { hour: '2 PM', mon: 8, tue: 7, wed: 8, thu: 9, fri: 8, sat: 5 },
  { hour: '3 PM', mon: 9, tue: 8, wed: 7, thu: 8, fri: 9, sat: 6 },
  { hour: '4 PM', mon: 7, tue: 6, wed: 8, thu: 7, fri: 8, sat: 4 },
  { hour: '5 PM', mon: 5, tue: 4, wed: 6, thu: 5, fri: 6, sat: 3 }
];

export function AnalyticsHub() {
  const [selectedReport, setSelectedReport] = useState('staff-activity');
  const [dateRange, setDateRange] = useState('last30');
  const [filterBy, setFilterBy] = useState<'all' | 'doctor' | 'service' | 'date'>('all');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      'active': { className: 'bg-green-100 text-green-700 border-green-200', label: 'Active' },
      'break': { className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'On Break' },
      'completed': { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Completed' },
      'in-progress': { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'In Progress' },
      'cancelled': { className: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' }
    };
    const variant = variants[status] || variants['completed'];
    return <Badge className={`border ${variant.className}`}>{variant.label}</Badge>;
  };

  const getHeatmapColor = (value: number) => {
    if (value <= 2) return '#E0F2FE'; // Very light blue
    if (value <= 4) return '#7DD3FC'; // Light blue
    if (value <= 6) return '#38BDF8'; // Medium blue
    if (value <= 8) return '#0EA5E9'; // Dark blue
    return '#0369A1'; // Very dark blue
  };

  const renderStaffActivityView = () => (
    <div className="space-y-6">
      {/* Staff Workload Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Staff Workload Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-1">
                {/* Header */}
                <div></div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Heatmap Grid */}
                {heatmapData.map(row => (
                  <Fragment key={row.hour}>
                    <div className="text-xs text-gray-600 dark:text-gray-400 py-2 pr-2 text-right">
                      {row.hour}
                    </div>
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => {
                      const value = row[day as keyof typeof row] as number;
                      return (
                        <div
                          key={day}
                          className="aspect-square rounded flex items-center justify-center text-xs font-medium hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                          style={{ backgroundColor: getHeatmapColor(value) }}
                          title={`${row.hour} ${day}: ${value} patients`}
                        >
                          {value}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Less busy</span>
                {[1, 3, 5, 7, 9].map(val => (
                  <div
                    key={val}
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: getHeatmapColor(val) }}
                  />
                ))}
                <span className="text-xs text-gray-600 dark:text-gray-400">More busy</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Activity Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Detailed Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Patients Served
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Hours Worked
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {staffActivities.map(activity => (
                  <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{activity.staff}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{activity.patientsServed}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.hoursWorked}h</p>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(activity.status)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPatientVisitsView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Patient Visit Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Dentist
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {patientVisits.map(visit => (
                <tr key={visit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{visit.patientName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{visit.service}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{visit.dentist}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{visit.time}</p>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(visit.status)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">
                      ₱{visit.revenue.toLocaleString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full flex gap-6">
      {/* Left Panel - Control Center */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    selectedReport === type.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${selectedReport === type.id ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${selectedReport === type.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                    {type.name}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Date Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {[
                { value: 'today', label: 'Today' },
                { value: 'last7', label: 'Last 7 Days' },
                { value: 'last30', label: 'Last 30 Days' },
                { value: 'ytd', label: 'Year to Date' },
                { value: 'custom', label: 'Custom Range' }
              ].map(range => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value)}
                  className={`w-full px-3 py-2 rounded-md text-sm text-left transition-colors ${
                    dateRange === range.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <Label className="text-xs">From</Label>
                  <Input type="date" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">To</Label>
                  <Input type="date" className="mt-1" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter By
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'doctor', label: 'By Doctor' },
                { value: 'service', label: 'By Service' },
                { value: 'date', label: 'By Date' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterBy(filter.value as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterBy === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Preview Area */}
      <div className="flex-1 space-y-4">
        {/* Export Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {reportTypes.find(r => r.id === selectedReport)?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dateRange === 'last30' ? 'Last 30 Days' : 'Selected Period'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <FileDown className="w-4 h-4 mr-2" />
                  Export to PDF
                </Button>
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Content */}
        {selectedReport === 'staff-activity' && renderStaffActivityView()}
        {selectedReport === 'patient-visits' && renderPatientVisitsView()}
        {selectedReport === 'efficiency' && renderStaffActivityView()}
        {selectedReport === 'revenue' && renderPatientVisitsView()}
      </div>
    </div>
  );
}
