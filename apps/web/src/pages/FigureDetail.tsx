import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { Heart, Share2, Clock } from 'lucide-react';
import { useFigures } from '@/context/FiguresContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
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
import { HeaderBackTitle } from '@/components/HeaderBackTitle';
import { useMasteryLevel } from '@/hooks/useMasteryLevel';
import { useVideoFullscreen } from '@/context/VideoFullscreenContext';
import { getYouTubeVideoId, getYouTubeEmbedUrl } from '@/utils/youtube';
import { Toast } from '@/components/Toast';

export function FigureDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getFigure } = useFigures();
  const { isFavorite, toggleFavorite, updateLastOpened } = useFavorites();
  const { user } = useAuth();
  const { setIsVideoFullscreen } = useVideoFullscreen();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showMasteryModal, setShowMasteryModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isFullscreenExited, setIsFullscreenExited] = useState(false);

  const figure = id ? getFigure(id) : undefined;
  const { masteryLevel, setMasteryLevel, hasMasteryLevel } = useMasteryLevel(figure?.id);
  const lastUpdatedIdRef = useRef<string | null>(null);

  // Update lastOpenedAt when figure is opened (only once per id, and only if favorited)
  useEffect(() => {
    if (figure && id && isFavorite(id) && lastUpdatedIdRef.current !== id) {
      const now = new Date().toISOString();
      updateLastOpened(id, now);
      lastUpdatedIdRef.current = id;
    }
  }, [id, figure, isFavorite, updateLastOpened]);

  // Detect landscape orientation on mobile
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768; // sm breakpoint
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      // Only enable landscape fullscreen if not explicitly exited by user
      const shouldBeFullscreen = isMobile && isLandscapeMode && !isFullscreenExited;
      setIsLandscape(shouldBeFullscreen);
      setIsVideoFullscreen(shouldBeFullscreen);
      
      // Reset exit flag when switching back to portrait
      if (!isLandscapeMode) {
        setIsFullscreenExited(false);
        setIsVideoFullscreen(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isFullscreenExited, setIsVideoFullscreen]);

  // Reset fullscreen exit flag when figure changes
  useEffect(() => {
    setIsFullscreenExited(false);
    setIsVideoFullscreen(false);
  }, [id, setIsVideoFullscreen]);

  // Detect when user exits fullscreen from YouTube player
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check if we're no longer in fullscreen
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isInFullscreen && isLandscape) {
        // User exited fullscreen, disable landscape fullscreen mode
        setIsFullscreenExited(true);
        setIsLandscape(false);
        setIsVideoFullscreen(false);
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<any>(null);
  // Create embed URL without end time to allow pausing instead of stopping
  // Enable JS API to control the player
  const embedUrl = videoId
    ? getYouTubeEmbedUrl(videoId, figure.startTime, undefined, true)
    : null;
  const endTimeSeconds = figure.endTime
    ? (() => {
        const parts = figure.endTime.split(':').map((p) => parseInt(p, 10));
        if (parts.some(isNaN)) return null;
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return null;
      })()
    : null;

  // Load YouTube IFrame API and handle pause at end time
  useEffect(() => {
    if (!videoId || !embedUrl || !endTimeSeconds) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const initializePlayer = () => {
      if (!iframeRef.current) return;

      // Use iframe ID or create one
      const iframeId = `youtube-player-${videoId}`;
      if (!iframeRef.current.id) {
        iframeRef.current.id = iframeId;
      }

      try {
        playerRef.current = new (window as any).YT.Player(iframeId, {
          events: {
            onReady: () => {
              // Start checking time when player is ready
              intervalId = setInterval(() => {
                if (playerRef.current && endTimeSeconds !== null) {
                  try {
                    const currentTime = playerRef.current.getCurrentTime();
                    const playerState = playerRef.current.getPlayerState();
                    // Only pause if video is playing and we've reached the end time
                    if (
                      playerState === (window as any).YT.PlayerState.PLAYING &&
                      currentTime >= endTimeSeconds
                    ) {
                      playerRef.current.pauseVideo();
                      if (intervalId) {
                        clearInterval(intervalId);
                        intervalId = null;
                      }
                    }
                  } catch (e) {
                    // Ignore errors
                  }
                }
              }, 100); // Check every 100ms
            },
            onStateChange: (event: any) => {
              // Clean up interval when video is paused or stopped
              if (
                event.data === (window as any).YT.PlayerState.PAUSED ||
                event.data === (window as any).YT.PlayerState.ENDED
              ) {
                if (intervalId) {
                  clearInterval(intervalId);
                  intervalId = null;
                }
              } else if (event.data === (window as any).YT.PlayerState.PLAYING) {
                // Restart interval when video starts playing
                if (!intervalId) {
                  intervalId = setInterval(() => {
                    if (playerRef.current && endTimeSeconds !== null) {
                      try {
                        const currentTime = playerRef.current.getCurrentTime();
                        if (currentTime >= endTimeSeconds) {
                          playerRef.current.pauseVideo();
                          if (intervalId) {
                            clearInterval(intervalId);
                            intervalId = null;
                          }
                        }
                      } catch (e) {
                        // Ignore errors
                      }
                    }
                  }, 100);
                }
              }
            },
          },
        });
      } catch (e) {
        // Ignore initialization errors
      }
    };

    // Load YouTube IFrame API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else if ((window as any).YT && (window as any).YT.Player) {
      // API already loaded, initialize player directly
      // Wait a bit for iframe to be ready
      setTimeout(initializePlayer, 100);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors on cleanup
        }
        playerRef.current = null;
      }
    };
  }, [videoId, embedUrl, endTimeSeconds]);

  const isFav = isFavorite(figure.id);

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
      setToast({ message: t('figure.linkCopied'), type: 'success' });
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
      <HeaderBackTitle title={figure.shortTitle} className="pb-2" />

      <div className={`max-w-4xl mx-auto w-full ${isLandscape ? 'fixed inset-0 z-[55] bg-black' : ''}`}>
        {/* Video Player */}
        {embedUrl && (
          <div
            className={`${
              isLandscape
                ? 'fixed inset-0 w-full h-full mb-0'
                : 'aspect-video w-full mb-6 bg-black rounded-lg mx-auto sm:w-96 lg:w-full'
            }`}
          >
            <iframe
              ref={iframeRef}
              id={`youtube-player-${videoId}`}
              src={embedUrl}
              title={figure.fullTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={`w-full h-full ${isLandscape ? '' : 'rounded-lg'}`}
              style={{ border: 0, display: 'block' }}
            />
          </div>
        )}
  
        {/* Details Section */}
        <div className={`space-y-6 ${isLandscape ? 'hidden' : ''}`}>
  
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleToggleFavorite}
              className="flex-1 min-h-[48px] w-full"
            >
              <Heart className={`h-5 w-5 mr-2 ${isFav ? 'fill-current text-red-500' : ''}`} />
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
                  <FigureTypeBadge type={figure.figureType} />
                  <ComplexityBadge complexity={figure.complexity} />
                </div>
              </CardContent>
            </Card>
            {isFav && !hasMasteryLevel && (
              <Button
                variant="default"
                size="lg"
                className="hidden sm:flex sm:w-60 sm:h-[52px]"
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
                <div className='flex justify-center sm:hidden'>
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

