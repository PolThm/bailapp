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
        'bg-popover border rounded-lg shadow-lg p-4 flex items-center gap-3',
        'transition-all duration-300',
        isExiting
          ? 'animate-out slide-out-to-bottom-5 fade-out-0'
          : 'animate-in slide-in-from-bottom-5 fade-in-0'
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
        onClick={handleClose}
        className="p-1 hover:bg-accent rounded transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

