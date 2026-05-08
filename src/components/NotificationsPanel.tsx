import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.tsx';
import { Badge } from './ui/badge.tsx';
import { Button } from './ui/button.tsx';
import { ScrollArea } from './ui/scroll-area.tsx';
import { 
  Bell, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  X,
  Settings
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'reminder' | 'update' | 'alert';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationsPanelProps {
  userRole: 'patient' | 'dentist' | 'admin';
  isOpen?: boolean;
  onClose?: () => void;
}

export function NotificationsPanel({ userRole, isOpen = false, onClose }: NotificationsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  // Sample notifications based on user role
  const getNotifications = (): Notification[] => {
    if (userRole === 'patient') {
      return [
        {
          id: '1',
          type: 'appointment',
          title: 'Upcoming Appointment Reminder',
          message: 'Your root canal follow-up with Dr. Johnson is tomorrow at 10:00 AM',
          time: '2 hours ago',
          isRead: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Due Soon',
          message: 'Your outstanding balance of $1,200 is due in 3 days',
          time: '1 day ago',
          isRead: false,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'update',
          title: 'Treatment Plan Updated',
          message: 'Dr. Smith has updated your treatment plan. View the changes in your portal.',
          time: '2 days ago',
          isRead: true,
          priority: 'medium'
        },
        {
          id: '4',
          type: 'reminder',
          title: 'Dental Hygiene Tip',
          message: 'Remember to floss daily and use the prescribed mouthwash',
          time: '3 days ago',
          isRead: true,
          priority: 'low'
        }
      ];
    } else if (userRole === 'dentist') {
      return [
        {
          id: '1',
          type: 'appointment',
          title: 'Patient Cancellation',
          message: 'Mike Wilson cancelled tomorrow\'s 2:00 PM appointment',
          time: '30 minutes ago',
          isRead: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'alert',
          title: 'Emergency Appointment Request',
          message: 'Sarah Davis is requesting an emergency appointment for severe tooth pain',
          time: '1 hour ago',
          isRead: false,
          priority: 'high'
        },
        {
          id: '3',
          type: 'update',
          title: 'Lab Results Ready',
          message: 'Crown for Patient #1245 is ready for pickup from the lab',
          time: '3 hours ago',
          isRead: true,
          priority: 'medium'
        },
        {
          id: '4',
          type: 'reminder',
          title: 'Daily Schedule Update',
          message: 'You have 8 appointments scheduled for today',
          time: '6 hours ago',
          isRead: true,
          priority: 'low'
        }
      ];
    } else {
      return [
        {
          id: '1',
          type: 'alert',
          title: 'System Backup Completed',
          message: 'Daily system backup completed successfully at 2:00 AM',
          time: '8 hours ago',
          isRead: false,
          priority: 'low'
        },
        {
          id: '2',
          type: 'update',
          title: 'New Staff Member Added',
          message: 'Dr. Williams has been added to the system and assigned patient caseload',
          time: '1 day ago',
          isRead: false,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'payment',
          title: 'Monthly Revenue Report',
          message: 'October revenue exceeded target by 15% - $125,000 total',
          time: '2 days ago',
          isRead: true,
          priority: 'medium'
        },
        {
          id: '4',
          type: 'alert',
          title: 'Equipment Maintenance Due',
          message: 'X-ray machine #2 is due for routine maintenance next week',
          time: '3 days ago',
          isRead: true,
          priority: 'high'
        }
      ];
    }
  };

  const notifications = getNotifications();
  
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'high') return notification.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'reminder': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'update': return <CheckCircle className="w-4 h-4 text-teal-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[600px] mt-16 mr-4">
        <Card className="h-full border-0">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                <CardTitle className="text-lg">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs"
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="text-xs"
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('high')}
                className="text-xs"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Priority
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              <div className="p-4 space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No notifications to show</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                        !notification.isRead ? 'border-l-4 border-l-teal-500' : ''
                      } ${getPriorityColor(notification.priority)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            {notification.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs ml-2">
                                Priority
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">{notification.time}</span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))  
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}