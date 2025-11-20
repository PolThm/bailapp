import { useEffect } from 'react';
import { X, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'info' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle2,
    info: Info,
    error: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-sm animate-in slide-in-from-bottom-5 duration-300',
        'bg-popover border rounded-lg shadow-lg p-4 flex items-center gap-3'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0',
          type === 'success' && 'text-green-500',
          type === 'info' && 'text-blue-500',
          type === 'error' && 'text-red-500'
        )}
      />
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-accent rounded transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

