import { createContext, useContext } from 'react';
import type { ToastType } from '@/components/Toast';

export interface ToastContextType {
  /** Shows a toast. It survives navigation, so it can be fired right before a redirect. */
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
