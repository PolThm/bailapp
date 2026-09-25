import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EmbeddedVideoSource } from '@/hooks/useEmbeddedPlayer';
import type {
  Complexity,
  DanceStyle,
  DanceSubStyle,
  FigureType,
  VideoFormat,
  VideoLanguage,
  VideoSource,
} from '@/types';
import { FigureMetadataFields } from '@/components/FigureMetadataFields';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VideoUploadField, type UploadedVideoDraft } from '@/components/VideoUploadField';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { EMPTY_FIGURE_METADATA, type FigureMetadataValues } from '@/lib/figureMetadata';
import { fetchYouTubeMeta } from '@/lib/youtubeOembed';
import { formatSecondsToTime } from '@/utils/timeParser';
import { getYouTubeThumbnail, getYouTubeVideoId, isYouTubeShort } from '@/utils/youtube';

interface NewFigureModalProps {
  open: boolean;
  onClose: () => void;
  /** May be async: the modal stays open, showing progress, until it settles. */
  onSubmit?: (data: NewFigureFormData) => void | Promise<unknown>;
}

/**
 * Only three fields are required: a video, a title, and a dance style.
 * Everything else has a sensible default and lives behind a disclosure, so the
 * form does not read as a wall of obligations.
 */
export interface NewFigureFormData {
  videoSource: VideoSource;
  /** Present when videoSource is 'youtube'. */
  youtubeUrl?: string;
  /** Present when videoSource is 'upload': converted, not yet sent to Storage. */
  uploadedVideo?: UploadedVideoDraft;
  shortTitle: string;
  /** Falls back to shortTitle; for YouTube it is the real video title. */
  fullTitle: string;
  videoFormat: VideoFormat;
  danceStyle: DanceStyle;
  description?: string;
  videoAuthor?: string;
  startTime?: string;
  endTime?: string;
  previewStartTime?: string;
  danceSubStyle?: DanceSubStyle;
  figureType?: FigureType;
  complexity?: Complexity;
  phrasesCount?: number;
  videoLanguage?: VideoLanguage;
}

type FormState = FigureMetadataValues & { youtubeUrl: string };

const EMPTY_FORM: FormState = { ...EMPTY_FIGURE_METADATA, youtubeUrl: '' };

export function NewFigureModal({ open, onClose, onSubmit }: NewFigureModalProps) {
  const { t } = useTranslation();
  const { isOffline } = useOfflineStatus();

  const [source, setSource] = useState<VideoSource>('upload');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideoDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // True while the picked file is being read and converted.
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // The real YouTube title, kept apart so a user-shortened title does not lose it.
  const [resolvedFullTitle, setResolvedFullTitle] = useState<string | null>(null);
  const [isResolvingMeta, setIsResolvingMeta] = useState(false);
  // Once the title field is touched, autofill must never overwrite it again.
  const titleTouchedRef = useRef(false);

  const videoId = source === 'youtube' ? getYouTubeVideoId(form.youtubeUrl) : null;

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  // Resolve the real title and channel from YouTube's oEmbed endpoint.
  useEffect(() => {
    if (source !== 'youtube' || !videoId) {
      setResolvedFullTitle(null);
      return;
    }

    const controller = new AbortController();
    setIsResolvingMeta(true);

    fetchYouTubeMeta(form.youtubeUrl, controller.signal)
      .then((meta) => {
        if (controller.signal.aborted) return;
        if (!meta) {
          setResolvedFullTitle(null);
          return;
        }
        setResolvedFullTitle(meta.title);
        setForm((prev) => ({
          ...prev,
          // Never clobber what the user typed.
          shortTitle: titleTouchedRef.current ? prev.shortTitle : meta.title,
          videoAuthor: prev.videoAuthor || meta.authorName,
        }));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsResolvingMeta(false);
      });

    return () => controller.abort();
    // form.youtubeUrl is intentionally read through videoId: re-resolving on
    // every keystroke of the same video would spam the endpoint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, videoId]);

  const resetAll = () => {
    if (uploadedVideo) URL.revokeObjectURL(uploadedVideo.localPreviewUrl);
    setForm(EMPTY_FORM);
    setSource('upload');
    setUploadedVideo(null);
    setErrors({});
    setSubmitError(null);
    setResolvedFullTitle(null);
    titleTouchedRef.current = false;
  };

  const handleClose = () => {
    if (isSubmitting || isVideoProcessing) return;
    resetAll();
    onClose();
  };

  const switchSource = (next: VideoSource) => {
    setSource(next);
    setErrors({});
    setSubmitError(null);
    titleTouchedRef.current = false;
    setResolvedFullTitle(null);
  };

  /**
   * Derived from the video itself: aspect ratio and duration for an upload,
   * URL shape for YouTube. There is no manual override - the rule decides.
   */
  const effectiveFormat = (): VideoFormat => {
    if (source === 'upload') return uploadedVideo?.videoFormat ?? 'classic';
    return isYouTubeShort(form.youtubeUrl) ? 'short' : 'classic';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors: Record<string, string> = {};
    if (source === 'youtube') {
      if (!form.youtubeUrl.trim()) {
        nextErrors.youtubeUrl = t('newFigure.errors.youtubeUrlRequired');
      } else if (!videoId) {
        nextErrors.youtubeUrl = t('newFigure.errors.youtubeUrlInvalid');
      }
    } else if (!uploadedVideo) {
      nextErrors.uploadedVideo = t('newFigure.upload.errors.videoRequired');
    } else if (!uploadedVideo.thumbnailBlob) {
      // Automatic capture can fail on some devices; the manual button is the
      // recourse, so the message points at it rather than just refusing.
      nextErrors.thumbnail = t('newFigure.upload.errors.thumbnailRequired');
    }
    if (!form.shortTitle.trim()) nextErrors.shortTitle = t('newFigure.errors.titleRequired');
    if (!form.danceStyle) nextErrors.danceStyle = t('newFigure.errors.danceStyleRequired');

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (source === 'upload' && isOffline) {
      setSubmitError(t('newFigure.upload.errors.offline'));
      return;
    }

    // The captured poster doubles as the preview's starting point, unless
    // the user set one explicitly.
    const defaultPreviewStart =
      source === 'upload' && uploadedVideo
        ? formatSecondsToTime(Math.round(uploadedVideo.thumbnailTime))
        : undefined;

    const title = form.shortTitle.trim();
    const parsedPhrases = parseInt(form.phrasesCount, 10);

    const payload: NewFigureFormData = {
      videoSource: source,
      youtubeUrl: source === 'youtube' ? form.youtubeUrl.trim() : undefined,
      uploadedVideo: source === 'upload' ? (uploadedVideo ?? undefined) : undefined,
      shortTitle: title,
      fullTitle: resolvedFullTitle ?? title,
      videoFormat: effectiveFormat(),
      danceStyle: form.danceStyle as DanceStyle,
      description: form.description.trim() || undefined,
      videoAuthor: form.videoAuthor.trim() || undefined,
      startTime: form.startTime.trim() || undefined,
      endTime: form.endTime.trim() || undefined,
      previewStartTime: form.previewStartTime.trim() || defaultPreviewStart,
      danceSubStyle: form.danceSubStyle,
      figureType: form.figureType,
      complexity: form.complexity,
      phrasesCount: Number.isFinite(parsedPhrases) && parsedPhrases > 0 ? parsedPhrases : undefined,
      videoLanguage: form.videoLanguage,
    };

    if (!onSubmit) {
      handleClose();
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      resetAll();
      onClose();
    } catch {
      // Keep the form and the converted video so a retry costs nothing.
      setSubmitError(t('newFigure.upload.errors.uploadFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Converting takes minutes on a phone; letting the user switch source,
  // submit or close mid-way would throw that work away silently.
  const isLocked = isSubmitting || isVideoProcessing;

  const format = effectiveFormat();
  const trimmerSource: EmbeddedVideoSource | null =
    source === 'youtube'
      ? videoId
        ? { kind: 'youtube', videoId }
        : null
      : uploadedVideo
        ? { kind: 'file', url: uploadedVideo.localPreviewUrl }
        : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader onClose={handleClose}>
          <DialogTitle>{t('newFigure.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Video source */}
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
            {(['upload', 'youtube'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => switchSource(option)}
                disabled={isLocked}
                className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                  source === option
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {option === 'youtube' ? t('newFigure.sourceYoutube') : t('newFigure.sourceUpload')}
              </button>
            ))}
          </div>

          {source === 'youtube' ? (
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">
                {t('newFigure.youtubeUrl')} {t('newFigure.required')}
              </Label>
              <Input
                id="youtubeUrl"
                placeholder={t('newFigure.youtubeUrlPlaceholder')}
                value={form.youtubeUrl}
                onChange={(e) => update({ youtubeUrl: e.target.value })}
                className={errors.youtubeUrl ? 'border-destructive' : ''}
              />
              {errors.youtubeUrl && <p className="text-sm text-destructive">{errors.youtubeUrl}</p>}
              {videoId && (
                <img
                  src={getYouTubeThumbnail(videoId)}
                  alt=""
                  className="w-full rounded-md"
                  loading="lazy"
                />
              )}
            </div>
          ) : (
            <VideoUploadField
              value={uploadedVideo}
              onChange={(draft) => {
                setUploadedVideo(draft);
                // Capturing a frame answers the complaint, so the error should
                // go with it rather than linger until the next submit.
                if (draft?.thumbnailBlob) {
                  setErrors((current) => {
                    if (!current.thumbnail) return current;
                    const { thumbnail: _removed, ...rest } = current;
                    return rest;
                  });
                }
              }}
              error={errors.uploadedVideo}
              disabled={isSubmitting}
              format={format}
              onProcessingChange={setIsVideoProcessing}
              thumbnailError={errors.thumbnail}
            />
          )}

          <FigureMetadataFields
            values={form}
            onChange={update}
            errors={errors}
            titleAdornment={
              isResolvingMeta ? (
                <Loader2 className="ml-2 inline h-3 w-3 animate-spin text-muted-foreground" />
              ) : null
            }
            onTitleChange={() => {
              titleTouchedRef.current = true;
            }}
            video={trimmerSource ? { source: trimmerSource, format } : undefined}
          />

          <p className="text-xs text-muted-foreground">{t('newFigure.privacyExplainer')}</p>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLocked}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isLocked}>
              {isLocked && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? t('newFigure.upload.sending')
                : isVideoProcessing
                  ? t('newFigure.upload.preparing')
                  : t('newFigure.addButton')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
