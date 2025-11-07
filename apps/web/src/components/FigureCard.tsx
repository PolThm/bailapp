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
  const thumbnailRef = useRef<HTMLDivElement | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoId = getYouTubeVideoId(figure.youtubeUrl);
  const thumbnail = videoId
    ? getYouTubeThumbnail(videoId, 'medium')
    : '/placeholder-video.jpg';
  const previewUrl = videoId
    ? getYouTubePreviewUrl(videoId, figure.startTime, figure.endTime)
    : null;
  
  const isFav = isFavorite(figure.id);

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
      const tolerance = 150;
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
        // Thumbnail is at center, start preview after a short delay
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
        }
        previewTimeoutRef.current = setTimeout(() => {
          // Double-check it's still at center before showing preview
          if (thumbnailElement && isAtCenter(thumbnailElement)) {
            setShowPreview(true);
          }
        }, 50);
      } else {
        // Thumbnail is not at center, stop preview
        if (previewTimeoutRef.current) {
          clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        setShowPreview(false);
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
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
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
            {showPreview && previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full object-cover pointer-events-none"
                allow="autoplay; encrypted-media"
                allowFullScreen={false}
                title={figure.shortTitle}
                style={{ border: 'none' }}
              />
            ) : (
              <img
                src={thumbnail}
                alt={figure.shortTitle}
                className="w-full h-full object-cover transition-opacity"
                loading="lazy"
              />
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

