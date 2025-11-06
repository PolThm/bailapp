import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, Share2, Clock } from 'lucide-react';
import { useFigures } from '@/context/FiguresContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DanceStyleBadge,
  DanceSubStyleBadge,
  FigureTypeBadge,
  ComplexityBadge,
} from '@/components/ui/badge';
import { AuthModal } from '@/components/AuthModal';
import { MasteryLevelModal } from '@/components/MasteryLevelModal';
import { useMasteryLevel } from '@/hooks/useMasteryLevel';
import { getYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube';

export function FigureDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getFigure, updateFigure } = useFigures();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showMasteryModal, setShowMasteryModal] = useState(false);

  const figure = id ? getFigure(id) : undefined;
  const { masteryLevel, setMasteryLevel, hasMasteryLevel } = useMasteryLevel(figure?.id);
  const lastUpdatedIdRef = useRef<string | null>(null);

  // Update lastOpenedAt when figure is opened (only once per id)
  useEffect(() => {
    if (figure && id && lastUpdatedIdRef.current !== id) {
      const now = new Date().toISOString();
      updateFigure(id, { lastOpenedAt: now });
      lastUpdatedIdRef.current = id;
    }
  }, [id, figure, updateFigure]);

  if (!figure) {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
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
    // TODO: For now, allow adding to favorites without authentication, when backend is plugged, add the auth check back:
    // if (!user) {
    //   setShowAuthModal(true);
    // } else {
    //   toggleFavorite(figure.id);
    // }
    toggleFavorite(figure.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: figure.shortTitle,
          text: t('figure.shareText', { 
            title: figure.shortTitle, 
            style: t(`badges.danceStyle.${figure.danceStyle}`)
          }),
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
    <>
      {/* Header with back icon and title */}
      <div className="pb-2">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="h-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all touch-manipulation"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold leading-tight line-clamp-2">{figure.shortTitle}</h1>
        </div>
      </div>

      {/* Video Player */}
      {embedUrl && (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden mb-6">
          <iframe
            src={embedUrl}
            title={figure.fullTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {/* Details Section */}
      <div className="space-y-6">

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleFavorite}
            className="flex-1 min-h-[48px]"
          >
            <Heart className={`h-5 w-5 mr-2 ${isFav ? 'fill-current text-red-500' : ''}`} />
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
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              <DanceStyleBadge style={figure.danceStyle} />
              {figure.danceSubStyle && (
                <DanceSubStyleBadge style={figure.danceStyle} subStyle={figure.danceSubStyle} />
              )}
              <FigureTypeBadge type={figure.figureType} />
              <ComplexityBadge complexity={figure.complexity} />
            </div>
          </CardContent>
        </Card>

        {/* Mastery Level Section - Only show if figure is favorited */}
        {isFav && (
          <>
            {hasMasteryLevel ? (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <h2 className="font-semibold">{t('figure.mastery.title')}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getMasteryColor(masteryLevel!)}`}>
                        {masteryLevel}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMasteryModal(true)}
                        className="ml-auto"
                      >
                        {t('common.update')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="default"
                className="w-full"
                onClick={() => setShowMasteryModal(true)}
              >
                {t('figure.mastery.enter')}
              </Button>
            )}
          </>
        )}

        {/* Description */}
        {figure.description && (
          <Card>
            <CardContent className="pt-4 space-y-1">
              <h2 className="font-semibold">{t('figure.fullTitle')}</h2>
              <h1 className="text-sm text-muted-foreground leading-relaxed">{figure.fullTitle}</h1>
              <h2 className="font-semibold pt-1">{t('figure.description')}</h2>
              <p className={`text-sm text-muted-foreground leading-relaxed ${!showFullDescription ? 'line-clamp-3' : ''}`}>
                {figure.description}
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
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('figure.duration')}</span>
              <span className="font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {t('figure.phrases', { count: figure.phrasesCount })}
              </span>
            </div>
            {figure.videoAuthor && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('figure.videoAuthor')}</span>
                <span className="font-medium">{figure.videoAuthor}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('figure.videoLanguage')}</span>
              <span className="font-medium">{t(`badges.videoLanguage.${figure.videoLanguage}`)}</span>
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
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Mastery Level Modal */}
      <MasteryLevelModal
        open={showMasteryModal}
        onClose={() => setShowMasteryModal(false)}
        currentLevel={masteryLevel}
        onSave={setMasteryLevel}
      />
    </>
  );
}

