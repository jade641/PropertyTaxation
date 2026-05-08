import { useState, type ReactNode } from 'react';
import { Button } from './ui/button.tsx';
import { Badge } from './ui/badge.tsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.tsx';
import { NotificationsPanel } from './NotificationsPanel';
const clinicLogo = '/taxsync-logo.png';
import { 
  Bell, 
  LogOut, 
  Settings, 
  User,
  Calendar,
  FileText,
  BarChart3,
  Users
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: 'patient' | 'dentist' | 'admin';
  userName?: string;
  onLogout: () => void;
  currentPage?: string;
  onPageChange?: (page: string) => void;
}

export function DashboardLayout({ 
  children, 
  userRole, 
  userName = 'John Doe', 
  onLogout,
  currentPage = 'overview',
  onPageChange
}: DashboardLayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  
  const getNavItems = () => {
    switch (userRole) {
      case 'patient':
        return [
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'treatment', label: 'Treatment', icon: FileText },
          { id: 'billing', label: 'Billing', icon: BarChart3 }
        ];
      case 'dentist':
        return [
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'treatments', label: 'Treatments', icon: FileText }
        ];
      case 'admin':
        return [
          { id: 'overview', label: 'Dashboard', icon: BarChart3 },
          { id: 'staff', label: 'Staff', icon: Users },
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'reports', label: 'Reports', icon: FileText }
        ];
      default:
        return [];
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'patient': return 'bg-teal-50 text-teal-800';
      case 'dentist': return 'bg-blue-50 text-blue-800';
      case 'admin': return 'bg-purple-50 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen" style={{ background: 'var(--dental-bg-gradient)' }}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={clinicLogo} 
                alt="Aurelia Dental Clinic" 
                className="w-10 h-10 rounded-lg shadow-sm"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Aurelia Dental Clinic</h1>
                <p className="text-xs text-gray-600">Patient Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500"></Badge>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5" />
            </Button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <Badge className={`text-xs ${getRoleColor()}`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              </div>
              <Avatar>
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-teal-100 text-teal-700">
                  {userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-gray-500 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 min-h-[calc(100vh-80px)]">
          <div className="p-4">
            {/* Sidebar Logo Section */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
              <img 
                src={clinicLogo} 
                alt="Aurelia Dental Clinic" 
                className="w-8 h-8 rounded-md"
              />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Aurelia Dental</h2>
                <p className="text-xs text-gray-500">Patient Portal</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 ${
                      isActive ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => onPageChange?.(item.id)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel 
        userRole={userRole}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}