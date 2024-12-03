import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  description?: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, description, onClose }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-primary text-primary';
      case 'error':
        return 'border-incinerator text-incinerator';
      case 'warning':
        return 'border-scorcher text-scorcher';
      case 'info':
        return 'border-exclusive text-exclusive';
      default:
        return 'border-primary text-primary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`fixed bottom-4 right-4 z-50 
        bg-black/90 border-2 rounded-sm px-4 py-3 
        font-press-start text-xs max-w-sm w-auto
        ${getTypeStyles()}`}
    >
      <div className="flex gap-3">
        <div className="flex-grow">
          <p className="mb-1">{message}</p>
          {description && (
            <p className="opacity-80 text-[10px]">{description}</p>
          )}
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}; 