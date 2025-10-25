import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
}

export function PullToRefreshIndicator({
  isPulling,
  isRefreshing,
  pullDistance,
  threshold,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldTrigger = pullDistance >= threshold;
  const isVisible = isPulling || isRefreshing;

  if (!isVisible && pullDistance === 0) return null;

  return (
    <div
      className="absolute left-0 right-0 top-4 z-50 flex items-center justify-center transition-all duration-300 ease-out"
      style={{
        transform: `translateY(${isRefreshing ? 0 : Math.max(0, pullDistance - 30)}px)`,
        opacity: isVisible ? Math.min(1, pullDistance / 40) : 0,
        pointerEvents: 'none',
      }}
    >
      <div className="flex flex-col items-center justify-center rounded-full border border-border/50 bg-background/80 px-4 py-3 shadow-lg backdrop-blur-sm">
        <div className="relative flex h-8 w-8 items-center justify-center">
          {isRefreshing ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center">
              <ArrowDown
                className={`h-6 w-6 text-primary transition-all duration-300 ${
                  shouldTrigger ? 'rotate-180 scale-110' : 'scale-90'
                }`}
                style={{
                  opacity: Math.min(1, pullDistance / 30),
                }}
              />
              {!shouldTrigger && pullDistance > 10 && (
                <svg className="absolute inset-0 h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 14}`}
                    strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
                    className="text-primary/30"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
