import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button.tsx';

interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ type = 'info', title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-white" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-white" />;
      default:
        return <AlertCircle className="w-5 h-5 text-white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className={`
        ${getBackgroundColor()}
        text-white rounded-lg shadow-lg p-4 min-w-[300px] max-w-md
        flex items-start gap-3
      `}>
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-medium text-sm">{title}</h4>}
          {message && <p className="text-sm opacity-90 mt-1">{message}</p>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 hover:bg-white/20 text-white p-1 h-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Toast container context
interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Expose addToast globally
  useEffect(() => {
    (window as any).showToast = addToast;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Helper function to show toasts
export const showToast = (toast: Omit<ToastData, 'id'>) => {
  if ((window as any).showToast) {
    (window as any).showToast(toast);
  }
};