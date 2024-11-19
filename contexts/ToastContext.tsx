import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '../components/Toast';
import { AnimatePresence } from 'framer-motion';

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    description?: string;
  } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning', description?: string) => {
    setToast({ message, type, description });
    setTimeout(() => {
      setToast(null);
    }, 5000); // Auto dismiss after 5 seconds
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            description={toast.description}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 