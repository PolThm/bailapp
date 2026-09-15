import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Figure } from '@/types';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFigures } from '@/hooks/useFigures';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import { deleteFigureFromFirestore } from '@/lib/services/figureService';
import { deleteFigureVideoFromStorage } from '@/lib/services/figureUploadService';
import { getFigureMediaClass, getFigureThumbnail } from '@/utils/figureVideo';

/** Lets a user follow up on the videos they uploaded: review status, submit, delete. */
export function MyVideosCard() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { userFigures, removeFigure } = useFigures();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [figureToDelete, setFigureToDelete] = useState<Figure | null>(null);

  // Everything the user added, YouTube links included - not just uploads.
  const figures = userFigures;

  const statusLabel = (figure: Figure): string => {
    if (figure.visibility === 'public') return t('profile.myVideos.statusApproved');
    switch (figure.moderationStatus) {
      case 'pending':
        return t('profile.myVideos.statusPending');
      case 'rejected':
        return t('profile.myVideos.statusRejected');
      default:
        return t('profile.myVideos.statusPrivate');
    }
  };

  const handleDelete = async (figure: Figure) => {
    setPendingId(figure.id);
    try {
      await deleteFigureFromFirestore(figure.id);
      if (figure.storagePath) {
        // After the document, so a failure here cannot strand a figure
        // pointing at bytes that no longer exist.
        await deleteFigureVideoFromStorage(figure.storagePath).catch(() => undefined);
      }
      removeFigure(figure.id);
      trackEvent(posthog, AnalyticsEvents.FIGURE_DELETED, { figureId: figure.id });
    } catch {
      // Service already logged it.
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.myVideos.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {figures.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('profile.myVideos.empty')}</p>
          ) : (
            figures.map((figure) => {
              const isBusy = pendingId === figure.id;

              return (
                <div key={figure.id} className="flex items-center gap-3">
                  <Link to={`/figure/${figure.id}`} className="shrink-0">
                    <img
                      src={getFigureThumbnail(figure)}
                      alt={figure.shortTitle}
                      className={`h-12 w-20 rounded ${getFigureMediaClass(figure)}`}
                      loading="lazy"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/figure/${figure.id}`}>
                      <p className="truncate text-sm font-medium">{figure.shortTitle}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">{statusLabel(figure)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('profile.myVideos.delete')}
                        aria-label={t('profile.myVideos.delete')}
                        onClick={() => setFigureToDelete(figure)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <ConfirmationModal
        open={figureToDelete !== null}
        onClose={() => setFigureToDelete(null)}
        title={t('profile.myVideos.deleteConfirm.title')}
        message={t('profile.myVideos.deleteConfirm.message')}
        confirmLabel={t('profile.myVideos.delete')}
        destructive
        onConfirm={() => {
          if (figureToDelete) {
            void handleDelete(figureToDelete);
          }
        }}
      />
    </>
  );
}
