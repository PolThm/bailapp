import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number;
  resistance?: number;
  elementRef: RefObject<HTMLElement | null>;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = 80,
  resistance = 2.5,
  elementRef,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleRefresh = useCallback(async () => {
    if (state.isRefreshing) return;
    
    setState((prev) => ({ ...prev, isRefreshing: true }));
    
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      // Small delay for smooth UX
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          isRefreshing: false,
          isPulling: false,
          pullDistance: 0,
        }));
      }, 300);
    }
  }, [onRefresh, state.isRefreshing]);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef?.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if scrolled to top
      if (element.scrollTop > 0) return;
      
      // Only trigger on touch devices
      if (e.touches.length !== 1) return;

      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      isDragging.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (element.scrollTop > 0) {
        isDragging.current = false;
        setState((prev) => ({ ...prev, isPulling: false, pullDistance: 0 }));
        return;
      }

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0) {
        e.preventDefault();
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setState((prev) => ({
          ...prev,
          isPulling: true,
          pullDistance: distance,
        }));
      } else {
        setState((prev) => ({ ...prev, isPulling: false, pullDistance: 0 }));
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging.current) return;
      
      isDragging.current = false;

      if (state.pullDistance >= threshold && !state.isRefreshing) {
        handleRefresh();
      } else {
        setState((prev) => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
        }));
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, resistance, state.pullDistance, state.isRefreshing, handleRefresh, elementRef]);

  return state;
}

