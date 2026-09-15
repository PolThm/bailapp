import { useState, useEffect, useRef } from 'react';
import { Heart, Share2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import type { Figure } from '@/types';
import { AuthModal } from '@/components/AuthModal';
import { HeaderBackTitle } from '@/components/HeaderBackTitle';
import { Loader } from '@/components/Loader';
import { MasteryLevelModal } from '@/components/MasteryLevelModal';
import { Toast } from '@/components/Toast';
import {
  DanceStyleBadge,
  DanceSubStyleBadge,
  FigureTypeBadge,
  ComplexityBadge,
} from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UnlistedFigureNotice } from '@/components/UnlistedFigureNotice';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useFigures } from '@/hooks/useFigures';
import { useMasteryLevel } from '@/hooks/useMasteryLevel';
import { useOrientation } from '@/hooks/useOrientation';
import { getFigureFromFirestore } from '@/lib/services/figureService';
import { getFigurePlayerTarget, isUnlistedFigure } from '@/utils/figureVideo';
import { parseTimeToSeconds } from '@/utils/timeParser';

// YouTube IFrame Player API types
interface YTPlayer {
  getCurrentTime(): number;
  pauseVideo(): void;
  destroy(): void;
}

interface YTPlayerEvent {
  data: number;
}

interface YTPlayerConstructor {
  new (
    element: HTMLIFrameElement,
    config: {
      events: {
        onReady?: () => void;
        onStateChange?: (event: YTPlayerEvent) => void;
      };
    }
  ): YTPlayer;
}

interface YTNamespace {
  Player: YTPlayerConstructor;
  PlayerState: {
    PLAYING: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
  interface Document {
    webkitFullscreenElement?: Element;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
  }
}

export function FigureDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getFigure } = useFigures();
  const { isFavorite, toggleFavorite, updateLastOpened, addToFavorites } = useFavorites();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showMasteryModal, setShowMasteryModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);
  const { isLandscapeMobile } = useOrientation();
  const [isFullscreenExited, setIsFullscreenExited] = useState(false);
  const [isLandscape, setIsLandscape] = useState(() => isLandscapeMobile && !isFullscreenExited);

  const contextFigure = id ? getFigure(id) : undefined;
  // An unlisted figure reached through a shared link is in nobody's catalogue
  // query, so it is absent from context. Fetch it by id, the only path the
  // security rules allow for it.
  const [fetchedFigure, setFetchedFigure] = useState<Figure | null>(null);
  const [isFetchingFigure, setIsFetchingFigure] = useState(false);

  useEffect(() => {
    if (!id || contextFigure) {
      setFetchedFigure(null);
      return;
    }

    let cancelled = false;
    setIsFetchingFigure(true);
    getFigureFromFirestore(id)
      .catch(() => null)
      .then((result) => {
        if (cancelled) return;
        setFetchedFigure(result);
      })
      .finally(() => {
        if (!cancelled) setIsFetchingFigure(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, contextFigure]);

  const figure = contextFigure ?? fetchedFigure ?? undefined;
  const { masteryLevel, setMasteryLevel, hasMasteryLevel } = useMasteryLevel(figure?.id);
  // Opening an unlisted figure is what puts it in your library: it appears in
  // no catalogue query, so favourites is the only way back to it. This covers
  // your own uploads too, which land here right after being created.
  const autoFavouritedRef = useRef<string | null>(null);
  // The favourites context returns fresh function identities each render, so
  // they are read through a ref: listing them as dependencies would re-run
  // this on every render.
  const favouritesApiRef = useRef({ isFavorite, addToFavorites });
  favouritesApiRef.current = { isFavorite, addToFavorites };

  const unlistedFigureId = figure && user && isUnlistedFigure(figure) ? figure.id : null;

  useEffect(() => {
    if (!unlistedFigureId) return;
    if (autoFavouritedRef.current === unlistedFigureId) return;
    if (favouritesApiRef.current.isFavorite(unlistedFigureId)) return;

    autoFavouritedRef.current = unlistedFigureId;
    favouritesApiRef.current.addToFavorites(unlistedFigureId);
  }, [unlistedFigureId]);
  const lastUpdatedIdRef = useRef<string | null>(null);

  // Initialize refs at the top level (before any conditional returns)
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const hasPassedEndTimeRef = useRef<boolean>(false);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const [isDescriptionLong, setIsDescriptionLong] = useState(false);

  // Update lastOpenedAt when figure is opened (only once per id, and only if favorited)
  useEffect(() => {
    if (figure && id && isFavorite(id) && lastUpdatedIdRef.current !== id) {
      const now = new Date().toISOString();
      updateLastOpened(id, now);
      lastUpdatedIdRef.current = id;
    }
  }, [id, figure, isFavorite, updateLastOpened]);

  // Measure description height to determine if it exceeds 3 lines
  useEffect(() => {
    const measureDescription = () => {
      if (descriptionRef.current && figure?.description && !showFullDescription) {
        const element = descriptionRef.current;
        // Temporarily remove line-clamp to measure full height
        const hasLineClamp = element.classList.contains('line-clamp-3');

        if (hasLineClamp) {
          element.classList.remove('line-clamp-3');
          // Force reflow to get accurate measurements
          void element.offsetHeight;
        }

        const fullHeight = element.scrollHeight;

        // Re-apply line-clamp if it was there
        if (hasLineClamp) {
          element.classList.add('line-clamp-3');
          void element.offsetHeight;
        }

        const clampedHeight = element.clientHeight;

        // If full height is greater than clamped height, text is truncated
        setIsDescriptionLong(fullHeight > clampedHeight);
      } else {
        setIsDescriptionLong(false);
      }
    };

    // Measure after initial render
    const timeoutId = setTimeout(measureDescription, 0);

    // Re-measure on window resize
    window.addEventListener('resize', measureDescription);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measureDescription);
    };
  }, [figure?.description, showFullDescription]);

  // Update landscape state based on orientation and fullscreen exit status
  useEffect(() => {
    const shouldBeFullscreen = isLandscapeMobile && !isFullscreenExited;
    setIsLandscape(shouldBeFullscreen);

    // Reset exit flag when switching back to portrait
    if (!isLandscapeMobile) {
      setIsFullscreenExited(false);
    }
  }, [isLandscapeMobile, isFullscreenExited]);

  // Reset fullscreen exit flag when figure changes
  useEffect(() => {
    setIsFullscreenExited(false);
  }, [id]);

  // Detect when user exits fullscreen from YouTube player
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check if we're no longer in fullscreen
      const isInFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isInFullscreen && isLandscape) {
        // User exited fullscreen, disable landscape fullscreen mode
        setIsFullscreenExited(true);
        setIsLandscape(false);
      } else if (isInFullscreen) {
        // User entered fullscreen, reset the exit flag
        setIsFullscreenExited(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isLandscape]);

  // Load YouTube IFrame API and handle pause at end time
  useEffect(() => {
    if (!figure) return;

    // Uploaded videos enforce their excerpt through onTimeUpdate on the
    // element itself; only the YouTube iframe needs the Player API.
    const target = getFigurePlayerTarget(figure);
    if (target?.kind !== 'iframe') return;

    const endTimeSeconds = figure.endTime ? parseTimeToSeconds(figure.endTime) : null;
    if (!endTimeSeconds) return;

    // Reset ref when figure changes
    hasPassedEndTimeRef.current = false;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkAndPause = () => {
      if (playerRef.current && endTimeSeconds !== null) {
        try {
          const currentTime = playerRef.current.getCurrentTime();

          // Check if we've passed the end time and haven't paused yet
          if (currentTime >= endTimeSeconds && !hasPassedEndTimeRef.current) {
            hasPassedEndTimeRef.current = true;
            playerRef.current.pauseVideo();
          } else if (currentTime < endTimeSeconds) {
            hasPassedEndTimeRef.current = false;
          }
        } catch {
          // Player not ready yet
        }
      }
    };

    const onYouTubeIframeAPIReady = () => {
      if (!iframeRef.current || !window.YT) return;

      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: () => {
            // Set up polling to check current time
            intervalId = setInterval(checkAndPause, 500);
          },
          onStateChange: (event: YTPlayerEvent) => {
            // If video is playing, reset the flag
            if (event.data === window.YT?.PlayerState.PLAYING) {
              const currentTime = playerRef.current?.getCurrentTime();
              if (currentTime !== undefined && currentTime < endTimeSeconds) {
                hasPassedEndTimeRef.current = false;
              }
            }
          },
        },
      });
    };

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      // Load the API
      if (!window.onYouTubeIframeAPIReady) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
      } else {
        window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore destruction errors
        }
      }
      playerRef.current = null;
    };
  }, [figure]);

  if (!figure) {
    if (isFetchingFigure) {
      return <Loader />;
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground">{t('figure.notFound')}</p>
        <Button onClick={() => navigate('/discover')} className="mt-4">
          {t('figure.backToDiscover')}
        </Button>
      </div>
    );
  }

  // Embed URL carries no end time, so the player pauses instead of stopping.
  const playerTarget = getFigurePlayerTarget(figure);

  const isFav = isFavorite(figure.id);

  // Native equivalent of the IFrame API polling above: pause rather than stop
  // at the excerpt's end, and re-arm if the viewer seeks back.
  const handlePlayerTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (playerTarget?.kind !== 'video' || playerTarget.endSeconds === null) return;
    const element = e.currentTarget;
    if (element.currentTime >= playerTarget.endSeconds && !hasPassedEndTimeRef.current) {
      hasPassedEndTimeRef.current = true;
      element.pause();
    } else if (element.currentTime < playerTarget.endSeconds) {
      hasPassedEndTimeRef.current = false;
    }
  };

  const handleToggleFavorite = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      toggleFavorite(figure.id);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: figure.shortTitle,
          text: t('figure.shareText', {
            title: figure.shortTitle,
            style: t(`badges.danceStyle.${figure.danceStyle}`),
          }),
          url: window.location.href,
        });
      } catch {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setToast({ message: t('figure.linkCopied'), type: 'success' });
    }
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
    <>
      {/* Header with back icon and title */}
      <HeaderBackTitle title={figure.shortTitle} className="pb-2" />

      <div
        className={`mx-auto w-full max-w-4xl ${isLandscape ? 'fixed inset-0 z-[55] bg-black' : ''}`}
      >
        {/* Video Player */}
        {playerTarget && (
          <div
            className={`${
              isLandscape
                ? 'fixed inset-0 mb-0 h-full w-full'
                : 'mx-auto mb-6 aspect-video w-full rounded-lg bg-black sm:w-96 lg:w-full'
            }`}
          >
            {playerTarget.kind === 'iframe' ? (
              <iframe
                ref={iframeRef}
                id={`youtube-player-${playerTarget.videoId}`}
                src={playerTarget.url}
                title={figure.fullTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={`h-full w-full ${isLandscape ? '' : 'rounded-lg'}`}
                style={{ border: 0, display: 'block' }}
              />
            ) : (
              <video
                ref={videoRef}
                src={playerTarget.url}
                poster={figure.thumbnailUrl}
                title={figure.fullTitle}
                controls
                playsInline
                preload="metadata"
                // object-contain so a vertical upload letterboxes in the 16:9
                // frame instead of being cropped.
                className={`h-full w-full object-contain ${isLandscape ? '' : 'rounded-lg'}`}
                style={{ display: 'block' }}
                onTimeUpdate={handlePlayerTimeUpdate}
              />
            )}
          </div>
        )}

        {/* Details Section */}
        <div className={`space-y-6 ${isLandscape ? 'hidden' : ''}`}>
          <UnlistedFigureNotice figure={figure} />
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleToggleFavorite}
              className="min-h-[48px] w-full flex-1"
            >
              <Heart className={`mr-2 h-5 w-5 ${isFav ? 'fill-current text-red-500' : ''}`} />
              {isFav ? t('figure.removeFromFavorites') : t('figure.addToFavorites')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              className="min-h-[48px] min-w-[48px]"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Badges */}
          <div className="flex flex-1 justify-between gap-3">
            <Card className="w-full">
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-2">
                  <DanceStyleBadge style={figure.danceStyle} />
                  {figure.danceSubStyle && (
                    <DanceSubStyleBadge style={figure.danceStyle} subStyle={figure.danceSubStyle} />
                  )}
                  {figure.figureType && <FigureTypeBadge type={figure.figureType} />}
                  <ComplexityBadge complexity={figure.complexity} />
                </div>
              </CardContent>
            </Card>
            {isFav && !hasMasteryLevel && (
              <Button
                variant="default"
                size="lg"
                className="hidden sm:flex sm:h-[52px] sm:w-60"
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                  } else {
                    setShowMasteryModal(true);
                  }
                }}
              >
                {t('figure.mastery.enter')}
              </Button>
            )}
          </div>

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
                          onClick={() => {
                            if (!user) {
                              setShowAuthModal(true);
                            } else {
                              setShowMasteryModal(true);
                            }
                          }}
                          className="ml-auto w-40 sm:w-56"
                        >
                          {t('common.update')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex justify-center sm:hidden">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      if (!user) {
                        setShowAuthModal(true);
                      } else {
                        setShowMasteryModal(true);
                      }
                    }}
                  >
                    {t('figure.mastery.enter')}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Description */}
          {figure.description && (
            <Card>
              <CardContent className="space-y-1 pt-4">
                <h2 className="font-semibold">{t('figure.fullTitle')}</h2>
                <h1 className="text-sm leading-relaxed text-muted-foreground">
                  {figure.fullTitle}
                </h1>
                <h2 className="pt-1 font-semibold">{t('figure.description')}</h2>
                <p
                  ref={descriptionRef}
                  className={`text-sm leading-relaxed text-muted-foreground ${!showFullDescription ? 'line-clamp-3' : ''}`}
                >
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
            <CardContent className="space-y-3 pt-4">
              {figure.phrasesCount !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('figure.duration')}</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="h-4 w-4" />
                    {t('figure.phrases', { count: figure.phrasesCount })}
                  </span>
                </div>
              )}
              {figure.videoAuthor && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('figure.videoAuthor')}</span>
                  <span className="font-medium">{figure.videoAuthor}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('figure.videoLanguage')}</span>
                <span className="font-medium">
                  {t(`badges.videoLanguage.${figure.videoLanguage}`)}
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
