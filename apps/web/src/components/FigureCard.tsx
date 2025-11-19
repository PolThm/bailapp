import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DanceStyleBadge,
  DanceSubStyleBadge,
  FigureTypeBadge,
  ComplexityBadge,
} from '@/components/ui/badge';
import { getYouTubeVideoId, getYouTubeThumbnail, getYouTubePreviewUrl } from '@/utils/youtube';
import { useFavorites } from '@/context/FavoritesContext';
import { useMasteryLevel } from '@/hooks/useMasteryLevel';
import type { Figure } from '@/types';
import { Clock, Heart, BicepsFlexed } from 'lucide-react';

interface FigureCardProps {
  figure: Figure;
  showImage?: boolean;
  showMastery?: boolean;
}

export function FigureCard({ figure, showImage = true, showMastery = false }: FigureCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { masteryLevel, hasMasteryLevel } = useMasteryLevel(figure.id);
  const [showPreview, setShowPreview] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement | null>(null);
  const previewLoadedRef = useRef(false);
  const showPreviewRef = useRef(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoId = getYouTubeVideoId(figure.youtubeUrl);
  const thumbnail = videoId
    ? getYouTubeThumbnail(videoId, 'medium')
    : '/placeholder-video.jpg';
  const previewUrl = videoId
    ? getYouTubePreviewUrl(videoId, figure.startTime, figure.endTime)
    : null;
  
  const isFav = isFavorite(figure.id);

  // Check if connection is slow (only 5g or wifi are considered good)
  const isSlowConnection = (): boolean => {
    // Check if navigator.connection is available (Chrome/Edge)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      // Only 5g, or wifi are considered good connections
      // Everything else (slow-2g, 2g, 3g, 4g) is considered slow
      if (effectiveType === '5g') {
        return false; // Good connection
      }
      // Check if on wifi (connection.type === 'wifi' or no cellular connection)
      if (connection.type === 'wifi' || (!connection.type && !effectiveType)) {
        return false; // Good connection (wifi or unknown - assume good)
      }
      // All other cases are slow connections
      return true;
    }
    // If connection API is not available, assume good connection
    return false;
  };

  // Detect when thumbnail touches the center of screen
  useEffect(() => {
    if (!thumbnailRef.current || !previewUrl) return;

    const thumbnailElement = thumbnailRef.current;
    let rafId: number | null = null;
    
    // Find the scroll container (main element)
    let parent = thumbnailElement.parentElement;
    while (parent && parent.tagName !== 'MAIN') {
      parent = parent.parentElement;
    }
    const scrollContainer = parent as HTMLElement | null;
    
    // Function to check if thumbnail center is at screen center (vertical only)
    const isAtCenter = (element: HTMLElement): boolean => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const centerY = viewportHeight / 2;
      
      // Check if the center of the thumbnail is at the center of the screen (vertical)
      const thumbnailCenterY = rect.top + rect.height / 2;
      
      // Allow a tolerance for the center detection (larger zone for easier triggering)
      const tolerance = 250;
      const isVerticalCenter = Math.abs(thumbnailCenterY - centerY) < tolerance;
      
      // Also check that the thumbnail is visible
      const isVisible = rect.top < viewportHeight && rect.bottom > 0;
      
      return isVerticalCenter && isVisible;
    };

    // Check position function using requestAnimationFrame for better performance
    const checkPosition = () => {
      if (!thumbnailElement) return;
      
      const atCenter = isAtCenter(thumbnailElement);
      
      if (atCenter) {
        // Thumbnail is at center, start preview immediately
        if (thumbnailElement && isAtCenter(thumbnailElement)) {
          // Only reset loaded state if preview wasn't already showing
          if (!showPreviewRef.current) {
            setPreviewReady(false);
            previewLoadedRef.current = false;
            
            // Set a timeout to cancel preview if it doesn't load within 3 seconds (only for new previews)
            if (loadTimeoutRef.current) {
              clearTimeout(loadTimeoutRef.current);
            }
            loadTimeoutRef.current = setTimeout(() => {
              if (!previewLoadedRef.current) {
                // Preview didn't load in time, cancel it and keep showing thumbnail
                setShowPreview(false);
                showPreviewRef.current = false;
                setPreviewReady(false);
              }
            }, 3000); // Timeout for slow connections
          }
          setShowPreview(true);
          showPreviewRef.current = true;
        }
      } else {
        // Thumbnail is not at center, stop preview
        setShowPreview(false);
        showPreviewRef.current = false;
        setPreviewReady(false); // Reset ready state
        previewLoadedRef.current = false; // Reset ref
        // Clear load timeout when preview is cancelled
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

    // Throttled check using requestAnimationFrame
    const throttledCheck = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(checkPosition);
    };

    // Initial check
    checkPosition();

    // Check on scroll and resize
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
  }, [previewUrl]);
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(figure.id);
  };

  // Get mastery level color based on percentage
  const getMasteryColor = (level: number): string => {
    if (level <= 30) {
      return 'text-red-600 dark:text-red-400';
    } else if (level >= 40 && level < 70) {
      return 'text-amber-500 dark:text-amber-400';
    } else if (level >= 70) {
      return 'text-green-600 dark:text-green-400';
    }
    // For 31-39, use orange as transition
    return 'text-orange-500 dark:text-orange-400';
  };

  return (
    <Link
      to={`/figure/${figure.id}`}
      className="touch-manipulation active:scale-[0.98] transition-transform"
    >
      <Card className="h-full transition-shadow hover:shadow-lg border-2 hover:border-primary/50 overflow-hidden">
        {/* Thumbnail / Preview */}
        {showImage && (
          <div
            ref={thumbnailRef}
            className="relative w-full aspect-video bg-muted overflow-hidden"
          >
            {/* Always show thumbnail as background */}
            <img
              src={thumbnail}
              alt={figure.shortTitle}
              className={`w-full h-full object-cover transition-opacity relative ${
                showPreview && previewReady ? 'opacity-0 z-0' : 'opacity-100 z-10'
              }`}
              loading="lazy"
            />
            {/* Iframe - keep at normal size but hidden until ready */}
            {showPreview && previewUrl && (
              <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{
                  zIndex: previewReady ? 20 : 0,
                  opacity: previewReady ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              >
                <iframe
                  src={previewUrl}
                  className="w-full h-full pointer-events-none"
                  allow="autoplay; encrypted-media"
                  allowFullScreen={false}
                  title={figure.shortTitle}
                  style={{ 
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                onLoad={() => {
                  previewLoadedRef.current = true;
                  // Clear timeout when loaded successfully
                  if (loadTimeoutRef.current) {
                    clearTimeout(loadTimeoutRef.current);
                    loadTimeoutRef.current = null;
                  }
                  // Wait before revealing the video to avoid black screen (only for slow connections)
                  if (readyTimeoutRef.current) {
                    clearTimeout(readyTimeoutRef.current);
                  }
                  if (isSlowConnection()) {
                    // For slow connections, wait before revealing
                    readyTimeoutRef.current = setTimeout(() => {
                      setPreviewReady(true);
                    }, 2000);
                  } else {
                    // For good connections, wait for YouTube to fully initialize and resize
                    readyTimeoutRef.current = setTimeout(() => {
                      setPreviewReady(true);
                    }, 700);
                  }
                }}
                onError={() => {
                  // If iframe fails to load, keep showing thumbnail
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
                }}
                />
              </div>
            )}
            {/* Duration badge if time range specified */}
            {figure.startTime && figure.endTime && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                {figure.startTime} - {figure.endTime}
              </div>
            )}
          </div>
        )}

        <CardHeader className="pb-3">
          <h3 className="font-semibold line-clamp-2 text-base leading-tight">
            {figure.shortTitle}
          </h3>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            <DanceStyleBadge style={figure.danceStyle} />
            {figure.danceSubStyle && (
              <DanceSubStyleBadge style={figure.danceStyle} subStyle={figure.danceSubStyle} />
            )}
            <FigureTypeBadge type={figure.figureType} />
            <ComplexityBadge complexity={figure.complexity} />
          </div>

          {/* Meta info */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {figure.phrasesCount} • {figure.videoAuthor}
              </span>
            </div>
            {/* Mastery level (only in Favorites page) or Favorite button */}
            {showMastery && hasMasteryLevel ? (
              <div className="flex items-center gap-1.5">
                <BicepsFlexed className={`h-4 w-4 ${getMasteryColor(masteryLevel!)}`} />
                <span className={`text-sm font-bold ${getMasteryColor(masteryLevel!)}`}>
                  {masteryLevel}%
                </span>
              </div>
            ) : !showMastery ? (
              <button
                onClick={handleFavoriteClick}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart 
                  className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                />
              </button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

