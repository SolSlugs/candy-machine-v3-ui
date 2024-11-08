import React from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-background bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block transform overflow-hidden rounded-lg bg-widget text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:align-middle"
             style={{ maxWidth: maxWidth }}>
          <div className="bg-widget px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {title && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium leading-6 text-primary">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-white hover:text-primary transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}; 