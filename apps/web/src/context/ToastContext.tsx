import { ReactNode, useCallback, useMemo, useState } from 'react';
import { Toast, type ToastType } from '@/components/Toast';
import { ToastContext } from '@/hooks/useToast';

interface ActiveToast {
  id: number;
  message: string;
  type: ToastType;
}

/**
 * Renders toasts above the router, so a toast fired just before navigating
 * survives the route change instead of unmounting with its origin page.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    // The id forces a remount, so firing a second toast restarts its timer
    // rather than inheriting the previous one's.
    setToast({ id: Date.now(), message, type });
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
}
