import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading?: boolean;
  onLoadMore: () => void;
  threshold?: number; // Distance from bottom in pixels before triggering load
  rootMargin?: string; // Margin around root for Intersection Observer
}

/**
 * Hook for infinite scroll functionality using Intersection Observer
 */
export function useInfiniteScroll({
  hasMore,
  isLoading = false,
  onLoadMore,
  threshold = 200,
  rootMargin,
}: UseInfiniteScrollOptions) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Use threshold to create rootMargin if not provided
  // rootMargin format: "top right bottom left" - we want to trigger before reaching bottom
  const computedRootMargin = rootMargin || `0px 0px ${threshold}px 0px`;

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      const isElementVisible = entry.isIntersecting;

      setIsIntersecting(isElementVisible);

      if (isElementVisible && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: computedRootMargin,
      threshold: 0.1,
    });

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current && sentinel) {
        observerRef.current.unobserve(sentinel);
      }
    };
  }, [handleIntersect, computedRootMargin]);

  return {
    sentinelRef,
    isIntersecting,
  };
}
