import { useToast } from '@/contexts/ToastContext';

export const useCustomToast = () => {
  const toast = useToast();

  return {
    success: (message: string, description?: string) => 
      toast.showToast(message, "success", description),
    error: (message: string, description?: string) => 
      toast.showToast(message, "error", description),
    info: (message: string, description?: string) => 
      toast.showToast(message, "info", description),
    warning: (message: string, description?: string) => 
      toast.showToast(message, "warning", description),
  };
}; 