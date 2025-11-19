import { Loader2 } from 'lucide-react';

interface LoaderProps {
  /**
   * Size of the spinner icon
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to use full height container (flex-1)
   * @default true
   */
  fullHeight?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Loader({
  size = 'md',
  fullHeight = true,
  className = '',
}: LoaderProps) {
  return (
    <div
      className={`flex items-center justify-center ${
        fullHeight ? 'flex-1 py-20' : 'py-12'
      } ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
    </div>
  );
}

