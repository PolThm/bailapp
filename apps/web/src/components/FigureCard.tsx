import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DanceStyleBadge,
  DanceSubStyleBadge,
  FigureTypeBadge,
  ComplexityBadge,
} from '@/components/ui/badge';
import { getYouTubeVideoId, getYouTubeThumbnail } from '@/utils/youtube';
import { useFavorites } from '@/context/FavoritesContext';
import type { Figure } from '@/types';
import { Clock, Heart } from 'lucide-react';

interface FigureCardProps {
  figure: Figure;
  showImage?: boolean;
}

export function FigureCard({ figure, showImage = true }: FigureCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const videoId = getYouTubeVideoId(figure.youtubeUrl);
  const thumbnail = videoId
    ? getYouTubeThumbnail(videoId, 'medium')
    : '/placeholder-video.jpg';
  
  const isFav = isFavorite(figure.id);
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(figure.id);
  };

  return (
    <Link
      to={`/figure/${figure.id}`}
      className="touch-manipulation active:scale-[0.98] transition-transform"
    >
      <Card className="h-full transition-shadow hover:shadow-lg border-2 hover:border-primary/50 overflow-hidden">
        {/* Thumbnail */}
        {showImage && (
          <div className="relative w-full aspect-video bg-muted">
            <img
              src={thumbnail}
              alt={figure.shortTitle}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Duration badge if time range specified */}
            {figure.startTime && figure.endTime && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
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

        <CardContent className="pt-0 space-y-2">
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
            {/* Favorite button */}
            <button
              onClick={handleFavoriteClick}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart 
                className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

