import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  DanceStyle,
  DanceSubStyle,
  FigureType,
  Complexity,
  VideoLanguage,
  VideoSource,
  Visibility,
} from '@/types';
import { Button } from '@/components/ui/button';
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
import { getYouTubeVideoId, getYouTubeThumbnail } from '@/utils/youtube';

interface NewFigureModalProps {
  open: boolean;
  onClose: () => void;
  /** May be async: the modal stays open, showing progress, until it settles. */
  onSubmit?: (data: NewFigureFormData) => void | Promise<void>;
}

export interface NewFigureFormData {
  videoSource: VideoSource;
  /** Present when videoSource is 'youtube'. */
  youtubeUrl?: string;
  /** Present when videoSource is 'upload': converted, not yet sent to Storage. */
  uploadedVideo?: UploadedVideoDraft;
  shortTitle: string;
  fullTitle: string;
  description?: string;
  videoAuthor?: string;
  startTime?: string;
  endTime?: string;
  danceStyle: DanceStyle;
  danceSubStyle?: DanceSubStyle;
  figureType: FigureType;
  complexity: Complexity;
  phrasesCount?: number;
  videoLanguage: VideoLanguage;
  visibility: Visibility;
}

export function NewFigureModal({ open, onClose, onSubmit }: NewFigureModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<NewFigureFormData>>({
    phrasesCount: 4,
    videoLanguage: 'english',
    visibility: 'public',
  });
  const [videoId, setVideoId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [source, setSource] = useState<VideoSource>('youtube');
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideoDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { isOffline } = useOfflineStatus();

  // Auto-extract video ID when YouTube URL changes
  useEffect(() => {
    if (source !== 'youtube') {
      setVideoId(null);
      return;
    }
    if (formData.youtubeUrl) {
      const id = getYouTubeVideoId(formData.youtubeUrl);
      setVideoId(id);
      // Auto-generate title from video ID (in real app, would fetch from YouTube API)
      if (id && !formData.shortTitle) {
        setFormData((prev) => ({
          ...prev,
          shortTitle: `Video ${id}`,
          fullTitle: `Video ${id} - Full Title`,
        }));
      }
    } else {
      setVideoId(null);
    }
  }, [formData.youtubeUrl, formData.shortTitle, source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (source === 'youtube') {
      if (!formData.youtubeUrl) newErrors.youtubeUrl = t('newFigure.errors.youtubeUrlRequired');
    } else if (!uploadedVideo) {
      newErrors.uploadedVideo = t('newFigure.upload.errors.videoRequired');
    }
    if (!formData.shortTitle) newErrors.shortTitle = t('newFigure.errors.titleRequired');
    if (!formData.fullTitle) newErrors.fullTitle = t('newFigure.errors.titleRequired');
    if (!formData.danceStyle) newErrors.danceStyle = t('newFigure.errors.danceStyleRequired');
    if (!formData.figureType) newErrors.figureType = t('newFigure.errors.figureTypeRequired');
    if (!formData.complexity) newErrors.complexity = t('newFigure.errors.complexityRequired');
    if (!formData.phrasesCount || formData.phrasesCount < 1) {
      newErrors.phrasesCount = t('newFigure.errors.phrasesCountMin');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Bytes cannot be queued: the offline sync queue stores strings only.
    if (source === 'upload' && isOffline) {
      setSubmitError(t('newFigure.upload.errors.offline'));
      return;
    }

    const payload: NewFigureFormData = {
      ...(formData as NewFigureFormData),
      videoSource: source,
      // Uploads always start private; security rules enforce it too.
      visibility: source === 'upload' ? 'private' : (formData.visibility ?? 'public'),
      youtubeUrl: source === 'youtube' ? formData.youtubeUrl : undefined,
      uploadedVideo: source === 'upload' ? (uploadedVideo ?? undefined) : undefined,
    };

    if (!onSubmit) {
      handleClose();
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      handleClose();
    } catch {
      // The caller already reported the failure; keep the form open with its
      // data so the user can retry without re-converting the video.
      setSubmitError(t('newFigure.upload.errors.uploadFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    if (uploadedVideo) {
      URL.revokeObjectURL(uploadedVideo.localPreviewUrl);
    }
    setFormData({ phrasesCount: 4, videoLanguage: 'english', visibility: 'public' });
    setVideoId(null);
    setErrors({});
    setSource('youtube');
    setUploadedVideo(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader onClose={handleClose}>
          <DialogTitle>{t('newFigure.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Video source */}
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
            {(['youtube', 'upload'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSource(option);
                  setErrors({});
                  setSubmitError(null);
                }}
                disabled={isSubmitting}
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
            <>
              {/* YouTube URL */}
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">
                  {t('newFigure.youtubeUrl')} {t('newFigure.required')}
                </Label>
                <Input
                  id="youtubeUrl"
                  placeholder={t('newFigure.youtubeUrlPlaceholder')}
                  value={formData.youtubeUrl || ''}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  className={errors.youtubeUrl ? 'border-destructive' : ''}
                />
                {errors.youtubeUrl && (
                  <p className="text-sm text-destructive">{errors.youtubeUrl}</p>
                )}
              </div>

              {/* Thumbnail Preview */}
              {videoId && (
                <div className="space-y-2">
                  <Label>{t('newFigure.thumbnail')}</Label>
                  <img
                    src={getYouTubeThumbnail(videoId)}
                    alt="Video thumbnail"
                    className="w-full rounded-md"
                  />
                </div>
              )}
            </>
          ) : (
            <VideoUploadField
              value={uploadedVideo}
              onChange={setUploadedVideo}
              error={errors.uploadedVideo}
              disabled={isSubmitting}
            />
          )}

          {/* Short Title */}
          <div className="space-y-2">
            <Label htmlFor="shortTitle">
              {t('newFigure.shortTitle')} {t('newFigure.required')}
            </Label>
            <Input
              id="shortTitle"
              placeholder={t('newFigure.shortTitlePlaceholder')}
              value={formData.shortTitle || ''}
              onChange={(e) => setFormData({ ...formData, shortTitle: e.target.value })}
              className={errors.shortTitle ? 'border-destructive' : ''}
            />
            {errors.shortTitle && <p className="text-sm text-destructive">{errors.shortTitle}</p>}
          </div>

          {/* Full Title */}
          <div className="space-y-2">
            <Label htmlFor="fullTitle">
              {t('newFigure.fullTitle')} {t('newFigure.required')}
            </Label>
            <Input
              id="fullTitle"
              placeholder={t('newFigure.fullTitlePlaceholder')}
              value={formData.fullTitle || ''}
              onChange={(e) => setFormData({ ...formData, fullTitle: e.target.value })}
              className={errors.fullTitle ? 'border-destructive' : ''}
            />
            {errors.fullTitle && <p className="text-sm text-destructive">{errors.fullTitle}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('newFigure.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('newFigure.descriptionPlaceholder')}
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Video Author */}
          <div className="space-y-2">
            <Label htmlFor="videoAuthor">{t('newFigure.videoAuthor')}</Label>
            <Input
              id="videoAuthor"
              placeholder={t('newFigure.videoAuthorPlaceholder')}
              value={formData.videoAuthor || ''}
              onChange={(e) => setFormData({ ...formData, videoAuthor: e.target.value })}
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">{t('newFigure.startTime')}</Label>
              <Input
                id="startTime"
                placeholder={t('newFigure.timePlaceholder')}
                value={formData.startTime || ''}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">{t('newFigure.endTime')}</Label>
              <Input
                id="endTime"
                placeholder={t('newFigure.timePlaceholder')}
                value={formData.endTime || ''}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          {/* Dance Style */}
          <div className="space-y-2">
            <Label htmlFor="danceStyle">
              {t('newFigure.danceStyle')} {t('newFigure.required')}
            </Label>
            <Select
              value={formData.danceStyle}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  danceStyle: value as DanceStyle,
                  danceSubStyle: undefined,
                })
              }
            >
              <SelectTrigger className={errors.danceStyle ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('newFigure.danceStylePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salsa">{t('badges.danceStyle.salsa')}</SelectItem>
                <SelectItem value="bachata">{t('badges.danceStyle.bachata')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.danceStyle && <p className="text-sm text-destructive">{errors.danceStyle}</p>}
          </div>

          {/* Dance Sub-Style */}
          {formData.danceStyle && (
            <div className="space-y-2">
              <Label htmlFor="danceSubStyle">{t('newFigure.danceSubStyle')}</Label>
              <Select
                value={formData.danceSubStyle}
                onValueChange={(value) =>
                  setFormData({ ...formData, danceSubStyle: value as DanceSubStyle })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('newFigure.danceSubStylePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {formData.danceStyle === 'salsa' && (
                    <>
                      <SelectItem value="cuban">{t('badges.danceSubStyle.cuban')}</SelectItem>
                      <SelectItem value="la-style">{t('badges.danceSubStyle.la-style')}</SelectItem>
                      <SelectItem value="ny-style">{t('badges.danceSubStyle.ny-style')}</SelectItem>
                      <SelectItem value="puerto-rican">
                        {t('badges.danceSubStyle.puerto-rican')}
                      </SelectItem>
                      <SelectItem value="colombian">
                        {t('badges.danceSubStyle.colombian')}
                      </SelectItem>
                      <SelectItem value="rueda-de-casino">
                        {t('badges.danceSubStyle.ruedadecasino')}
                      </SelectItem>
                      <SelectItem value="romantica">
                        {t('badges.danceSubStyle.romantica')}
                      </SelectItem>
                    </>
                  )}
                  {formData.danceStyle === 'bachata' && (
                    <>
                      <SelectItem value="dominican">
                        {t('badges.danceSubStyle.dominican')}
                      </SelectItem>
                      <SelectItem value="modern">{t('badges.danceSubStyle.modern')}</SelectItem>
                      <SelectItem value="sensual">{t('badges.danceSubStyle.sensual')}</SelectItem>
                      <SelectItem value="urban">{t('badges.danceSubStyle.urban')}</SelectItem>
                      <SelectItem value="fusion">{t('badges.danceSubStyle.fusion')}</SelectItem>
                      <SelectItem value="ballroom">{t('badges.danceSubStyle.ballroom')}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Figure Type */}
          <div className="space-y-2">
            <Label htmlFor="figureType">
              {t('newFigure.figureType')} {t('newFigure.required')}
            </Label>
            <Select
              value={formData.figureType}
              onValueChange={(value) =>
                setFormData({ ...formData, figureType: value as FigureType })
              }
            >
              <SelectTrigger className={errors.figureType ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('newFigure.figureTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="figure">{t('badges.figureType.figure')}</SelectItem>
                <SelectItem value="basic-step">{t('badges.figureType.basicStep')}</SelectItem>
                <SelectItem value="complex-step">{t('badges.figureType.complexStep')}</SelectItem>
                <SelectItem value="mix">{t('badges.figureType.mix')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.figureType && <p className="text-sm text-destructive">{errors.figureType}</p>}
          </div>

          {/* Complexity */}
          <div className="space-y-2">
            <Label htmlFor="complexity">
              {t('newFigure.complexity')} {t('newFigure.required')}
            </Label>
            <Select
              value={formData.complexity}
              onValueChange={(value) =>
                setFormData({ ...formData, complexity: value as Complexity })
              }
            >
              <SelectTrigger className={errors.complexity ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('newFigure.complexityPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">{t('badges.complexity.basic')}</SelectItem>
                <SelectItem value="basic-intermediate">
                  {t('badges.complexity.basicIntermediate')}
                </SelectItem>
                <SelectItem value="intermediate">{t('badges.complexity.intermediate')}</SelectItem>
                <SelectItem value="intermediate-advanced">
                  {t('badges.complexity.intermediateAdvanced')}
                </SelectItem>
                <SelectItem value="advanced">{t('badges.complexity.advanced')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.complexity && <p className="text-sm text-destructive">{errors.complexity}</p>}
          </div>

          {/* Phrases Count */}
          <div className="space-y-2">
            <Label htmlFor="phrasesCount">
              {t('newFigure.phrasesCount')} {t('newFigure.required')}
            </Label>
            <Input
              id="phrasesCount"
              type="number"
              min="1"
              placeholder={t('newFigure.phrasesCountPlaceholder')}
              value={formData.phrasesCount || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phrasesCount: parseInt(e.target.value) || 0,
                })
              }
              className={errors.phrasesCount ? 'border-destructive' : ''}
            />
            {errors.phrasesCount && (
              <p className="text-sm text-destructive">{errors.phrasesCount}</p>
            )}
          </div>

          {/* Video Language */}
          <div className="space-y-2">
            <Label htmlFor="videoLanguage">
              {t('newFigure.videoLanguage')} {t('newFigure.required')}
            </Label>
            <Select
              value={formData.videoLanguage}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  videoLanguage: value as VideoLanguage,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="french">🇫🇷 {t('badges.videoLanguage.french')}</SelectItem>
                <SelectItem value="english">🇬🇧 {t('badges.videoLanguage.english')}</SelectItem>
                <SelectItem value="spanish">🇪🇸 {t('badges.videoLanguage.spanish')}</SelectItem>
                <SelectItem value="italian">🇮🇹 {t('badges.videoLanguage.italian')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility - uploads are always created private, so the choice is
              only offered for YouTube links. */}
          {source === 'youtube' && (
            <div className="space-y-2">
              <Label htmlFor="visibility">
                {t('newFigure.visibility')} {t('newFigure.required')}
              </Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    visibility: value as Visibility,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('newFigure.visibilityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t('badges.visibility.public')}</SelectItem>
                  <SelectItem value="private">{t('badges.visibility.private')}</SelectItem>
                  <SelectItem value="unlisted">{t('badges.visibility.unlisted')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t('newFigure.upload.sending') : t('newFigure.addButton')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
