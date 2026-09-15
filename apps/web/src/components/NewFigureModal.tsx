import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  Complexity,
  DanceStyle,
  DanceSubStyle,
  FigureType,
  VideoFormat,
  VideoLanguage,
  VideoSource,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Collapsible } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { VideoUploadField, type UploadedVideoDraft } from '@/components/VideoUploadField';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
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

type FormState = {
  youtubeUrl: string;
  shortTitle: string;
  description: string;
  videoAuthor: string;
  startTime: string;
  endTime: string;
  previewStartTime: string;
  danceStyle?: DanceStyle;
  danceSubStyle?: DanceSubStyle;
  figureType?: FigureType;
  complexity?: Complexity;
  phrasesCount: string;
  videoLanguage?: VideoLanguage;
};

const EMPTY_FORM: FormState = {
  youtubeUrl: '',
  shortTitle: '',
  description: '',
  videoAuthor: '',
  startTime: '',
  endTime: '',
  previewStartTime: '',
  phrasesCount: '',
};

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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="shortTitle">
              {t('newFigure.figureTitle')} {t('newFigure.required')}
              {isResolvingMeta && (
                <Loader2 className="ml-2 inline h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </Label>
            <Input
              id="shortTitle"
              placeholder={t('newFigure.titlePlaceholder')}
              value={form.shortTitle}
              onChange={(e) => {
                titleTouchedRef.current = true;
                update({ shortTitle: e.target.value });
              }}
              className={errors.shortTitle ? 'border-destructive' : ''}
            />
            {errors.shortTitle && <p className="text-sm text-destructive">{errors.shortTitle}</p>}
          </div>

          {/* Dance style */}
          <div className="space-y-2">
            <Label htmlFor="danceStyle">
              {t('newFigure.danceStyle')} {t('newFigure.required')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(['salsa', 'bachata'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => update({ danceStyle: style, danceSubStyle: undefined })}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    form.danceStyle === style
                      ? 'border-primary bg-primary/10 text-foreground'
                      : errors.danceStyle
                        ? 'border-destructive text-muted-foreground'
                        : 'border-input text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(`badges.danceStyle.${style}`)}
                </button>
              ))}
            </div>
            {errors.danceStyle && <p className="text-sm text-destructive">{errors.danceStyle}</p>}
          </div>

          {/* Everything below is optional */}
          <Collapsible title={t('newFigure.moreOptions')} hint={t('newFigure.moreOptionsHint')}>
            <div className="space-y-2">
              <Label htmlFor="description">{t('newFigure.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('newFigure.descriptionPlaceholder')}
                rows={3}
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </div>

            {form.danceStyle && (
              <div className="space-y-2">
                <Label>{t('newFigure.danceSubStyle')}</Label>
                <Select
                  value={form.danceSubStyle}
                  onValueChange={(value) => update({ danceSubStyle: value as DanceSubStyle })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('newFigure.danceSubStylePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(form.danceStyle === 'salsa'
                      ? ([
                          ['cuban', 'cuban'],
                          ['la-style', 'la-style'],
                          ['ny-style', 'ny-style'],
                          ['puerto-rican', 'puerto-rican'],
                          ['colombian', 'colombian'],
                          ['rueda-de-casino', 'ruedadecasino'],
                          ['romantica', 'romantica'],
                        ] as const)
                      : ([
                          ['dominican', 'dominican'],
                          ['modern', 'modern'],
                          ['sensual', 'sensual'],
                          ['urban', 'urban'],
                          ['fusion', 'fusion'],
                          ['ballroom', 'ballroom'],
                        ] as const)
                    ).map(([value, key]) => (
                      <SelectItem key={value} value={value}>
                        {t(`badges.danceSubStyle.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('newFigure.complexity')}</Label>
              <Select
                value={form.complexity}
                onValueChange={(value) => update({ complexity: value as Complexity })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('newFigure.complexityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">{t('badges.complexity.basic')}</SelectItem>
                  <SelectItem value="basic-intermediate">
                    {t('badges.complexity.basicIntermediate')}
                  </SelectItem>
                  <SelectItem value="intermediate">
                    {t('badges.complexity.intermediate')}
                  </SelectItem>
                  <SelectItem value="intermediate-advanced">
                    {t('badges.complexity.intermediateAdvanced')}
                  </SelectItem>
                  <SelectItem value="advanced">{t('badges.complexity.advanced')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('newFigure.figureType')}</Label>
              <Select
                value={form.figureType}
                onValueChange={(value) => update({ figureType: value as FigureType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('newFigure.figureTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="figure">{t('badges.figureType.figure')}</SelectItem>
                  <SelectItem value="basic-step">{t('badges.figureType.basicStep')}</SelectItem>
                  <SelectItem value="complex-step">{t('badges.figureType.complexStep')}</SelectItem>
                  <SelectItem value="mix">{t('badges.figureType.mix')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">{t('newFigure.startTime')}</Label>
                <Input
                  id="startTime"
                  placeholder={t('newFigure.timePlaceholder')}
                  value={form.startTime}
                  onChange={(e) => update({ startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">{t('newFigure.endTime')}</Label>
                <Input
                  id="endTime"
                  placeholder={t('newFigure.timePlaceholder')}
                  value={form.endTime}
                  onChange={(e) => update({ endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="previewStartTime">{t('newFigure.previewStartTime')}</Label>
              <Input
                id="previewStartTime"
                placeholder={t('newFigure.timePlaceholder')}
                value={form.previewStartTime}
                onChange={(e) => update({ previewStartTime: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t('newFigure.previewStartTimeHint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phrasesCount">{t('newFigure.phrasesCount')}</Label>
              <Input
                id="phrasesCount"
                type="number"
                min="1"
                placeholder={t('newFigure.phrasesCountPlaceholder')}
                value={form.phrasesCount}
                onChange={(e) => update({ phrasesCount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoAuthor">{t('newFigure.videoAuthor')}</Label>
              <Input
                id="videoAuthor"
                placeholder={t('newFigure.videoAuthorPlaceholder')}
                value={form.videoAuthor}
                onChange={(e) => update({ videoAuthor: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('newFigure.videoLanguage')}</Label>
              <Select
                value={form.videoLanguage}
                onValueChange={(value) => update({ videoLanguage: value as VideoLanguage })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('newFigure.videoLanguagePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="french">🇫🇷 {t('badges.videoLanguage.french')}</SelectItem>
                  <SelectItem value="english">🇬🇧 {t('badges.videoLanguage.english')}</SelectItem>
                  <SelectItem value="spanish">🇪🇸 {t('badges.videoLanguage.spanish')}</SelectItem>
                  <SelectItem value="italian">🇮🇹 {t('badges.videoLanguage.italian')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Collapsible>

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
