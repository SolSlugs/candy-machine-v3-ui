import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastProps = {
  message: string;
  type: ToastType;
  description?: string;
  duration?: number;
  onClose: () => void;
};

const Toast = ({ message, type, description, duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow time for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const baseClasses = "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 transform";
  const visibilityClasses = isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0";
  
  const typeClasses = {
    success: "bg-primary text-background",
    error: "bg-incinerator text-white",
    info: "bg-widget text-white",
    warning: "bg-scorcher text-white"
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${visibilityClasses}`}>
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-bold">{message}</h3>
          {description && <p className="mt-1 text-sm">{description}</p>}
        </div>
        <button onClick={() => setIsVisible(false)} className="ml-4 text-current hover:opacity-75">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Toast manager to handle multiple toasts
type ToastManagerProps = {
  toasts: Array<{
    id: string;
    message: string;
    type: ToastType;
    description?: string;
  }>;
  removeToast: (id: string) => void;
};

export const ToastManager = ({ toasts, removeToast }: ToastManagerProps) => {
  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          description={toast.description}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}; 