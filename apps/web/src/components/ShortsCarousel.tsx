import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ShortCard } from './ShortCard';
import type { Figure } from '@/types';

interface ShortsCarouselProps {
  shorts: Figure[];
}

export function ShortsCarousel({ shorts }: ShortsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [visibleCardIds, setVisibleCardIds] = useState<Set<string>>(new Set());
  const rafIdRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check if screen size is desktop (>= sm breakpoint)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640; // sm breakpoint
    }
    return false;
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Check scroll position for navigation buttons
  const checkScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
  }, []);

  // Check which card is closest to the vertical center of the screen
  // Only one preview at a time
  const checkVisibleCards = useCallback(() => {
    if (!scrollContainerRef.current) return;
    checkScrollPosition();

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Find all ShortCard wrapper elements in this container
    const cards = container.querySelectorAll('[data-short-card]');

    // Get viewport center Y position (same as FigureCard)
    const viewportHeight = window.innerHeight;
    const centerY = viewportHeight / 2;
    const tolerance = 170; // Same tolerance as FigureCard

    let closestCardId: string | null = null;
    let closestDistance = Infinity;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardId = card.getAttribute('data-short-id');

      if (!cardId) return;

      // Check if card is visible horizontally in the scroll container
      const isHorizontallyVisible =
        cardRect.left >= containerRect.left &&
        cardRect.right <= containerRect.right &&
        cardRect.width > 0 &&
        cardRect.height > 0;

      if (!isHorizontallyVisible) return;

      // Check if the center of the card is at the center of the screen (vertical)
      // Same logic as FigureCard
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const distanceFromCenter = Math.abs(cardCenterY - centerY);
      const isVerticalCenter = distanceFromCenter < tolerance;

      // Also check that the card is visible
      const isVisible = cardRect.top < viewportHeight && cardRect.bottom > 0;

      if (isVerticalCenter && isVisible && distanceFromCenter < closestDistance) {
        closestCardId = cardId;
        closestDistance = distanceFromCenter;
      }
    });

    // Only set one card as visible (the closest to center)
    if (closestCardId) {
      setVisibleCardIds(new Set([closestCardId]));
    } else {
      setVisibleCardIds(new Set());
    }
  }, [checkScrollPosition]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Find the main scroll container (same as FigureCard)
    let parent = container.parentElement;
    while (parent && parent.tagName !== 'MAIN') {
      parent = parent.parentElement;
    }
    const mainScrollContainer = parent as HTMLElement | null;

    // Initial check
    checkVisibleCards();

    // Throttled check using requestAnimationFrame
    const throttledCheck = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        checkVisibleCards();
        rafIdRef.current = null;
      });
    };

    // Listen to scroll events on both horizontal carousel and main page scroll
    container.addEventListener('scroll', throttledCheck, { passive: true });

    // Also listen to main page scroll (same as FigureCard)
    if (mainScrollContainer) {
      mainScrollContainer.addEventListener('scroll', throttledCheck, { passive: true });
    } else {
      window.addEventListener('scroll', throttledCheck, { passive: true });
    }

    window.addEventListener('resize', throttledCheck, { passive: true });

    return () => {
      container.removeEventListener('scroll', throttledCheck);
      if (mainScrollContainer) {
        mainScrollContainer.removeEventListener('scroll', throttledCheck);
      } else {
        window.removeEventListener('scroll', throttledCheck);
      }
      window.removeEventListener('resize', throttledCheck);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [shorts, checkVisibleCards]);

  // Handle scroll navigation
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of container width
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="relative col-span-full overflow-hidden">
      {/* Left Fade Gradient - Desktop only */}
      {isDesktop && canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 z-[5] h-full w-2 bg-gradient-to-r from-background to-transparent" />
      )}

      {/* Left Navigation Button - Desktop only */}
      {isDesktop && canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-background hover:shadow-xl"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Right Navigation Button - Desktop only */}
      {isDesktop && canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-background hover:shadow-xl"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Right Fade Gradient - Desktop only */}
      {isDesktop && canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 z-[5] h-full w-2 bg-gradient-to-l from-background to-transparent" />
      )}

      <div
        ref={scrollContainerRef}
        className="scrollbar-hide smooth-scroll -mx-4 overflow-x-auto px-4"
      >
        <div className="flex items-stretch gap-3">
          {shorts.map((short) => (
            <div key={short.id} data-short-card data-short-id={short.id} className="flex">
              <ShortCard figure={short} shouldShowPreview={visibleCardIds.has(short.id)} />
            </div>
          ))}
          <div className="w-2 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
