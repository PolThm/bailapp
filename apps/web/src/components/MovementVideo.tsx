import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Figure, MovementVideo } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFigures } from '@/hooks/useFigures';
import { getFigureClipTarget, getFigureVideoFormat } from '@/utils/figureVideo';
import { parseTimeToSeconds } from '@/utils/timeParser';

interface MovementVideoModalProps {
  open: boolean;
  onClose: () => void;
  figureId: string;
  video?: MovementVideo;
  onChangeFigure: () => void;
  onSave: (video: MovementVideo | undefined) => void;
}

export function MovementVideoModal({
  open,
  onClose,
  figureId,
  video,
  onChangeFigure,
  onSave,
}: MovementVideoModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader onClose={onClose}>
          <DialogTitle>
            {video
              ? t('choreographies.movements.editVideo')
              : t('choreographies.movements.linkVideo')}
          </DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so the form starts from the saved value each time */}
        <MovementVideoForm
          figureId={figureId}
          video={video}
          onCancel={onClose}
          onChangeFigure={onChangeFigure}
          onSave={(next) => {
            onSave(next);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function MovementVideoForm({
  figureId,
  video,
  onCancel,
  onChangeFigure,
  onSave,
}: {
  figureId: string;
  video?: MovementVideo;
  onCancel: () => void;
  onChangeFigure: () => void;
  onSave: (video: MovementVideo | undefined) => void;
}) {
  const { t } = useTranslation();
  const { getFigure } = useFigures();
  const figure = getFigure(figureId);
  const keepsTimes = video?.figureId === figureId;
  const [startTime, setStartTime] = useState(keepsTimes ? (video?.startTime ?? '') : '');
  const [endTime, setEndTime] = useState(keepsTimes ? (video?.endTime ?? '') : '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedStart = startTime.trim();
    const trimmedEnd = endTime.trim();

    const nextErrors: Record<string, string> = {};
    if (trimmedStart && parseTimeToSeconds(trimmedStart) === null) {
      nextErrors.startTime = t('choreographies.movements.videoTimeInvalid');
    }
    if (trimmedEnd && parseTimeToSeconds(trimmedEnd) === null) {
      nextErrors.endTime = t('choreographies.movements.videoTimeInvalid');
    }
    if (Object.keys(nextErrors).length === 0) {
      // Compare the bounds actually played, which fall back to the figure's own
      const effectiveStart = trimmedStart || figure?.startTime;
      const effectiveEnd = trimmedEnd || figure?.endTime;
      const startSeconds = effectiveStart ? parseTimeToSeconds(effectiveStart) : null;
      const endSeconds = effectiveEnd ? parseTimeToSeconds(effectiveEnd) : null;
      if (startSeconds !== null && endSeconds !== null && endSeconds <= startSeconds) {
        nextErrors.endTime = t('choreographies.movements.videoEndBeforeStart');
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      figureId,
      ...(trimmedStart ? { startTime: trimmedStart } : {}),
      ...(trimmedEnd ? { endTime: trimmedEnd } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('choreographies.movements.video')}</Label>
        <div className="flex items-center gap-3 rounded-md border px-3 py-2">
          <span className={`flex-1 truncate ${figure ? '' : 'text-muted-foreground'}`}>
            {figure ? figure.shortTitle : t('choreographies.movements.videoUnavailable')}
          </span>
          <button
            type="button"
            onClick={onChangeFigure}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            {t('choreographies.movements.changeVideo')}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="movementVideoStart">{t('newFigure.startTime')}</Label>
            <Input
              id="movementVideoStart"
              placeholder={figure?.startTime || t('newFigure.timePlaceholder')}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={errors.startTime ? 'border-destructive' : ''}
            />
            {errors.startTime && <p className="text-sm text-destructive">{errors.startTime}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="movementVideoEnd">{t('newFigure.endTime')}</Label>
            <Input
              id="movementVideoEnd"
              placeholder={figure?.endTime || t('newFigure.timePlaceholder')}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={errors.endTime ? 'border-destructive' : ''}
            />
            {errors.endTime && <p className="text-sm text-destructive">{errors.endTime}</p>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('choreographies.movements.videoTimesHint')}
        </p>
      </div>

      {video && (
        <button
          type="button"
          onClick={() => onSave(undefined)}
          className="text-sm text-destructive hover:underline"
        >
          {t('choreographies.movements.removeVideo')}
        </button>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          {t('common.cancel')}
        </Button>
        <Button type="submit" className="flex-1" disabled={!figure}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}

interface MovementVideoPlayerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  video: MovementVideo;
}

export function MovementVideoPlayerModal({
  open,
  onClose,
  title,
  video,
}: MovementVideoPlayerModalProps) {
  const { t } = useTranslation();
  const { getFigure } = useFigures();
  const figure = getFigure(video.figureId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader onClose={onClose}>
          <DialogTitle className="line-clamp-2 leading-tight">{title}</DialogTitle>
        </DialogHeader>
        {figure ? (
          <MovementVideoClip figure={figure} video={video} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('choreographies.movements.videoUnavailable')}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MovementVideoClip({ figure, video }: { figure: Figure; video: MovementVideo }) {
  const hasReachedEndRef = useRef(false);
  const target = getFigureClipTarget(figure, video.startTime, video.endTime);
  const clipStart = video.startTime || figure.startTime;
  const clipEnd = video.endTime || figure.endTime;
  const range = clipStart || clipEnd ? `${clipStart || '0:00'} → ${clipEnd ?? ''}`.trim() : '';
  const frameClass =
    getFigureVideoFormat(figure) === 'short'
      ? 'mx-auto aspect-[9/16] h-[65vh] max-w-full'
      : 'aspect-video w-full';

  // Pause at the end of the excerpt, and restart it when played again from there
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (target?.kind !== 'video' || target.endSeconds === null) return;
    const element = e.currentTarget;
    if (element.currentTime >= target.endSeconds && !hasReachedEndRef.current) {
      hasReachedEndRef.current = true;
      element.pause();
    }
  };

  const handlePlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (target?.kind !== 'video' || !hasReachedEndRef.current) return;
    hasReachedEndRef.current = false;
    e.currentTarget.currentTime = target.startSeconds ?? 0;
  };

  return (
    <div className="space-y-2">
      <div>
        <Link
          to={`/figure/${figure.id}`}
          className="block truncate text-sm text-primary hover:underline"
        >
          @{figure.shortTitle}
        </Link>
        {range && <p className="text-sm text-muted-foreground">{range}</p>}
      </div>
      {target?.kind === 'iframe' && (
        <iframe
          src={target.url}
          title={figure.fullTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={`rounded-lg bg-black ${frameClass}`}
          style={{ border: 0, display: 'block' }}
        />
      )}
      {target?.kind === 'video' && (
        <video
          src={target.url}
          poster={figure.thumbnailUrl}
          title={figure.fullTitle}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className={`rounded-lg bg-black object-contain ${frameClass}`}
          style={{ display: 'block' }}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
        />
      )}
    </div>
  );
}
