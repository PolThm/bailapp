import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ArrowLeft, Heart, Share2, Clock } from 'lucide-react';
import { useFigures } from '@/context/FiguresContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DanceStyleBadge,
  FigureTypeBadge,
  ComplexityBadge,
  LanguageBadge,
} from '@/components/ui/badge';
import { AuthDialog } from '@/components/AuthDialog';
import { getYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube';

export function FigureDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getFigure } = useFigures();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const figure = id ? getFigure(id) : undefined;

  if (!figure) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-lg text-muted-foreground">{t('figure.notFound')}</p>
        <Button onClick={() => navigate('/discover')} className="mt-4">
          {t('figure.backToDiscover')}
        </Button>
      </div>
    );
  }

  const videoId = getYouTubeVideoId(figure.youtubeUrl);
  const embedUrl = videoId
    ? getYouTubeEmbedUrl(videoId, figure.startTime, figure.endTime)
    : null;

  const isFav = isFavorite(figure.id);

  const handleToggleFavorite = () => {
    if (!user) {
      setShowAuthDialog(true);
    } else {
      toggleFavorite(figure.id);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: figure.title,
          text: figure.description || '',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  // Check if description is long (> 3 lines, ~150 chars)
  const isDescriptionLong = (figure.description?.length || 0) > 150;
  const displayDescription = showFullDescription || !isDescriptionLong
    ? figure.description
    : figure.description?.substring(0, 150) + '...';

  return (
    <div className="flex flex-col space-y-6 pb-8">
      {/* Back Button */}
      <div className="px-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>

      {/* Video Player */}
      {embedUrl && (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={figure.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {/* Details Section */}
      <div className="px-4 space-y-6">
        {/* Title */}
        <h1 className="text-2xl font-bold leading-tight">{figure.title}</h1>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant={isFav ? 'default' : 'outline'}
            onClick={handleToggleFavorite}
            className="flex-1 min-h-[48px]"
          >
            <Heart className={`h-5 w-5 mr-2 ${isFav ? 'fill-current' : ''}`} />
            {isFav ? t('figure.removeFromFavorites') : t('figure.addToFavorites')}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            className="min-w-[48px] min-h-[48px]"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Badges */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <DanceStyleBadge style={figure.danceStyle} />
              <FigureTypeBadge type={figure.figureType} />
              <ComplexityBadge complexity={figure.complexity} />
              <LanguageBadge language={figure.videoLanguage} />
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {figure.description && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              <h2 className="font-semibold">{t('figure.description')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {displayDescription}
              </p>
              {isDescriptionLong && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-sm text-primary hover:underline"
                >
                  {showFullDescription ? t('figure.showLess') : t('figure.showMore')}
                </button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Meta Information */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            {figure.videoAuthor && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('figure.videoAuthor')}</span>
                <span className="font-medium">{figure.videoAuthor}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('figure.duration')}</span>
              <span className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t('figure.phrases', { count: figure.phrasesCount })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('figure.visibility')}</span>
              <span className="font-medium">{t(`badges.visibility.${figure.visibility}`)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('figure.importedBy')}</span>
              <span className="font-medium">{figure.importedBy}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auth Dialog */}
      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
    </div>
  );
}

