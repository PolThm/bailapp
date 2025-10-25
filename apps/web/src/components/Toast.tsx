import { useEffect, useState } from 'react';
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
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const icons = {
    success: CheckCircle2,
    info: Info,
    error: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-sm',
        'flex items-center gap-3 rounded-lg p-4 shadow-lg',
        'transition-all duration-300',
        'border-l-4',
        // Success styling
        type === 'success' && [
          'bg-green-50 dark:bg-green-950/30',
          'border-green-500 dark:border-green-400',
          'text-green-900 dark:text-green-100',
        ],
        // Info styling
        type === 'info' && [
          'bg-blue-50 dark:bg-blue-950/30',
          'border-blue-500 dark:border-blue-400',
          'text-blue-900 dark:text-blue-100',
        ],
        // Error styling
        type === 'error' && [
          'bg-red-50 dark:bg-red-950/30',
          'border-red-500 dark:border-red-400',
          'text-red-900 dark:text-red-100',
        ],
        isExiting
          ? 'animate-out fade-out-0 slide-out-to-bottom-5'
          : 'animate-in fade-in-0 slide-in-from-bottom-5'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0',
          type === 'success' && 'text-green-600 dark:text-green-400',
          type === 'info' && 'text-blue-600 dark:text-blue-400',
          type === 'error' && 'text-red-600 dark:text-red-400'
        )}
      />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className={cn(
          'rounded p-1 transition-colors',
          'hover:bg-black/5 dark:hover:bg-white/10',
          type === 'success' && 'text-green-700 dark:text-green-300',
          type === 'info' && 'text-blue-700 dark:text-blue-300',
          type === 'error' && 'text-red-700 dark:text-red-300'
        )}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
