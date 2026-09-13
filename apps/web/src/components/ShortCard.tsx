import { useState, useEffect, useRef } from 'react';
import { ImageOff, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Figure } from '@/types';
import { DanceStyleBadge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UnlistedFigureBadge } from '@/components/UnlistedFigureNotice';
import { useFavorites } from '@/context/FavoritesContext';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import {
  getFigurePreviewTarget,
  getFigureThumbnail,
  shouldLetterboxFigure,
} from '@/utils/figureVideo';

interface ShortCardProps {
  figure: Figure;
  shouldShowPreview?: boolean;
}

export function ShortCard({ figure, shouldShowPreview = false }: ShortCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [thumbnailError, setThumbnailError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const networkQuality = useNetworkQuality();
  const thumbnailRef = useRef<HTMLDivElement | null>(null);
  const previewLoadedRef = useRef(false);
  const showPreviewRef = useRef(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thumbnail = getFigureThumbnail(figure, 'high');
  const previewTarget = getFigurePreviewTarget(figure);
  // Contain rather than crop when the video's shape does not match its frame,
  // so a portrait clip posted as a classic is letterboxed, not zoomed into.
  const mediaFit = shouldLetterboxFigure(figure) ? 'object-contain' : 'object-cover';
  // Kept as a plain string: effects below depend on it, and an object would
  // change identity on every render and re-run them in a loop.
  const previewUrl = previewTarget?.url ?? null;

  const isFav = isFavorite(figure.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(figure.id);
  };

  // Check if screen size is desktop (md or larger)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint
    }
    return false;
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Check if card is fully visible in viewport
  const isFullyVisible = (element: HTMLElement): boolean => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check if all edges are within viewport
    return (
      rect.left >= 0 &&
      rect.top >= 0 &&
      rect.right <= viewportWidth &&
      rect.bottom <= viewportHeight
    );
  };

  // Handle hover for preview (desktop only) - only if fully visible
  const handleMouseEnter = () => {
    if (!previewUrl || !isDesktop) return;

    // Check if card is fully visible before showing preview
    if (thumbnailRef.current && !isFullyVisible(thumbnailRef.current)) {
      return;
    }

    if (!showPreviewRef.current) {
      setPreviewReady(false);
      previewLoadedRef.current = false;

      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      loadTimeoutRef.current = setTimeout(() => {
        if (!previewLoadedRef.current) {
          setShowPreview(false);
          showPreviewRef.current = false;
          setPreviewReady(false);
        }
      }, 3000);
    }
    setShowPreview(true);
    showPreviewRef.current = true;
  };

  const handleMouseLeave = () => {
    if (!isDesktop) return;

    setShowPreview(false);
    showPreviewRef.current = false;
    setPreviewReady(false);
    previewLoadedRef.current = false;
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  };

  // Handle preview based on shouldShowPreview prop (for carousel)
  useEffect(() => {
    if (!previewUrl) return;

    if (shouldShowPreview) {
      if (!showPreviewRef.current) {
        setPreviewReady(false);
        previewLoadedRef.current = false;

        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
        loadTimeoutRef.current = setTimeout(() => {
          if (!previewLoadedRef.current) {
            setShowPreview(false);
            showPreviewRef.current = false;
            setPreviewReady(false);
          }
        }, 3000);
      }
      setShowPreview(true);
      showPreviewRef.current = true;
    } else {
      setShowPreview(false);
      showPreviewRef.current = false;
      setPreviewReady(false);
      previewLoadedRef.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
    }
  }, [shouldShowPreview, previewUrl]);

  // Detect when thumbnail is fully visible (mobile only) - only if shouldShowPreview is not provided
  useEffect(() => {
    if (!thumbnailRef.current || !previewUrl || isDesktop || shouldShowPreview !== undefined)
      return;

    const thumbnailElement = thumbnailRef.current;
    let rafId: number | null = null;

    let parent = thumbnailElement.parentElement;
    while (parent && parent.tagName !== 'MAIN') {
      parent = parent.parentElement;
    }
    const scrollContainer = parent as HTMLElement | null;

    const checkPosition = () => {
      if (!thumbnailElement) return;

      // Check if card is fully visible before showing preview
      const fullyVisible = isFullyVisible(thumbnailElement);

      if (fullyVisible) {
        if (!showPreviewRef.current) {
          setPreviewReady(false);
          previewLoadedRef.current = false;

          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
          }
          loadTimeoutRef.current = setTimeout(() => {
            if (!previewLoadedRef.current) {
              setShowPreview(false);
              showPreviewRef.current = false;
              setPreviewReady(false);
            }
          }, 3000);
        }
        setShowPreview(true);
        showPreviewRef.current = true;
      } else {
        setShowPreview(false);
        showPreviewRef.current = false;
        setPreviewReady(false);
        previewLoadedRef.current = false;
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        if (readyTimeoutRef.current) {
          clearTimeout(readyTimeoutRef.current);
          readyTimeoutRef.current = null;
        }
      }
    };

    const throttledCheck = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(checkPosition);
    };

    checkPosition();

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', throttledCheck, { passive: true });
    } else {
      window.addEventListener('scroll', throttledCheck, { passive: true });
    }
    window.addEventListener('resize', throttledCheck, { passive: true });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', throttledCheck);
      } else {
        window.removeEventListener('scroll', throttledCheck);
      }
      window.removeEventListener('resize', throttledCheck);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
    };
  }, [previewUrl, isDesktop]);

  // Shared by both preview renderers. An iframe only reports that it loaded,
  // not that it is painting, so YouTube needs a reveal delay to avoid flashing
  // a black rectangle. A <video> firing `playing` is already showing frames,
  // so it passes skipRevealDelay.
  const handlePreviewLoaded = (skipRevealDelay = false) => {
    previewLoadedRef.current = true;
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }

    if (isDesktop) {
      setPreviewReady(true);
      return;
    }

    const delay = (() => {
      switch (networkQuality.slowLevel) {
        case 'slight':
          return 2000;
        case 'moderate':
          return 4000;
        case 'very':
          return null;
        default:
          return 800;
      }
    })();

    if (delay === null) {
      setShowPreview(false);
      showPreviewRef.current = false;
      setPreviewReady(false);
      return;
    }

    if (skipRevealDelay) {
      setPreviewReady(true);
      return;
    }

    readyTimeoutRef.current = setTimeout(() => {
      setPreviewReady(true);
    }, delay);
  };

  const handlePreviewError = () => {
    previewLoadedRef.current = false;
    setShowPreview(false);
    setPreviewReady(false);
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  };

  // `loop` alone restarts at the top of the file, not at the excerpt, so the
  // preview window is enforced by hand.
  const handlePreviewTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (previewTarget?.kind !== 'video') return;
    const element = e.currentTarget;
    const { startSeconds, endSeconds } = previewTarget;
    if (endSeconds !== null && element.currentTime >= endSeconds) {
      element.currentTime = startSeconds ?? 0;
    }
  };

  return (
    <Link
      to={`/figure/${figure.id}`}
      className="block h-full touch-manipulation transition-transform active:scale-[0.98]"
    >
      <Card className="flex h-full w-[140px] flex-shrink-0 flex-col overflow-hidden border-2 transition-shadow hover:border-primary/50 hover:shadow-lg sm:w-[160px]">
        {/* Thumbnail - Vertical format for Shorts */}
        <div
          ref={thumbnailRef}
          className="relative aspect-[9/16] w-full overflow-hidden bg-muted"
          style={{
            willChange: 'contents',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Always show thumbnail as background */}
          {thumbnailError ? (
            <div className="relative z-10 flex h-full w-full items-center justify-center bg-muted">
              <ImageOff className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={thumbnail}
              alt={figure.shortTitle}
              className={`relative h-full w-full ${mediaFit} ${
                showPreview && previewReady ? 'z-0 opacity-0' : 'z-10 opacity-100'
              }`}
              style={{
                willChange: 'opacity',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transition: 'opacity 0.2s ease-in-out',
              }}
              loading="lazy"
              onError={() => setThumbnailError(true)}
            />
          )}
          <UnlistedFigureBadge figure={figure} />
          {/* Preview - keep at normal size but hidden until ready */}
          {showPreview && previewTarget && (
            <div
              className="absolute inset-0 h-full w-full overflow-hidden"
              style={{
                zIndex: previewReady ? 20 : 0,
                opacity: previewReady ? 1 : 0,
                willChange: 'opacity',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transition: 'opacity 0.2s ease-in-out',
              }}
            >
              {previewTarget.kind === 'iframe' ? (
                <iframe
                  src={previewTarget.url}
                  className="pointer-events-none h-full w-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen={false}
                  title={figure.shortTitle}
                  style={{
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                  onLoad={() => handlePreviewLoaded()}
                  onError={handlePreviewError}
                />
              ) : (
                <video
                  src={previewTarget.url}
                  className={`pointer-events-none h-full w-full ${mediaFit}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onPlaying={() => handlePreviewLoaded(true)}
                  onTimeUpdate={handlePreviewTimeUpdate}
                  onError={handlePreviewError}
                />
              )}
            </div>
          )}
          {/* Badge in absolute position - bottom left */}
          <div
            className="absolute bottom-2 left-2 z-30"
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <DanceStyleBadge style={figure.danceStyle} />
          </div>
          {/* Favorite button in absolute position - bottom right */}
          <button
            onClick={handleFavoriteClick}
            className="absolute bottom-2 right-2 z-30 rounded-full p-1.5 transition-colors"
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        </div>

        <CardContent className="flex flex-1 flex-col p-2">
          <h3 className="line-clamp-2 text-xs font-semibold leading-tight">{figure.shortTitle}</h3>
        </CardContent>
      </Card>
    </Link>
  );
}
