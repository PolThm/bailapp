import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Film, ImageDown, Loader2, Upload, X } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useTranslation } from 'react-i18next';
import type { VideoFormat } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import { formatBytes } from '@/lib/utils';
import {
  VideoCompressionError,
  compressVideo,
  type VideoCompressionErrorCode,
} from '@/lib/video/compressVideo';
import { THUMBNAIL_CAPTURE_FALLBACK_SECONDS } from '@/lib/video/constants';
import { extractThumbnail } from '@/lib/video/extractThumbnail';

/** A converted video held in memory, ready to be uploaded on submit. */
export interface UploadedVideoDraft {
  blob: Blob;
  /** Absent when the device refused to decode a frame; the figure then has no poster. */
  thumbnailBlob: Blob | null;
  durationSeconds: number;
  width: number;
  height: number;
  videoFormat: VideoFormat;
  /** Object URL for the local preview; revoked when the draft is replaced. */
  localPreviewUrl: string;
  /** Where the poster frame was captured, in seconds. */
  thumbnailTime: number;
}

interface VideoUploadFieldProps {
  value: UploadedVideoDraft | null;
  onChange: (draft: UploadedVideoDraft | null) => void;
  error?: string;
  disabled?: boolean;
}

type Stage = 'idle' | 'analyzing' | 'compressing' | 'ready';

const ERROR_KEY_BY_CODE: Record<VideoCompressionErrorCode, string> = {
  'unsupported-browser': 'unsupportedBrowser',
  'unreadable-file': 'unreadableFile',
  'no-video-track': 'noVideoTrack',
  'cannot-decode': 'cannotDecode',
  'no-encoder': 'noEncoder',
  'too-long': 'tooLong',
  'encode-failed': 'encodeFailed',
};

export function VideoUploadField({ value, onChange, error, disabled }: VideoUploadFieldProps) {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [stage, setStage] = useState<Stage>(value ? 'ready' : 'idle');
  const [progress, setProgress] = useState(0);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [isCapturingFrame, setIsCapturingFrame] = useState(false);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  // Conversion keeps running after unmount otherwise, and would then write to
  // a dead component.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires a change event.
    event.target.value = '';
    if (!file) return;

    if (value) {
      URL.revokeObjectURL(value.localPreviewUrl);
      onChange(null);
    }

    setInternalError(null);
    setErrorDetail(null);
    setProgress(0);
    setStage('analyzing');

    try {
      const compressed = await compressVideo(file, (ratio) => {
        if (!isMountedRef.current) return;
        setStage('compressing');
        setProgress(ratio);
      });

      // Grab the poster a moment in, so it is not the black frame many
      // recordings open on.
      const posterTime = Math.min(
        THUMBNAIL_CAPTURE_FALLBACK_SECONDS,
        compressed.durationSeconds / 2
      );
      // A poster is a nicety. Losing a successful conversion because the
      // device would not decode a still frame is not acceptable, so failure
      // here is swallowed and the figure simply has no poster.
      const thumbnailBlob = await extractThumbnail(compressed.blob, posterTime).catch(() => null);

      if (!isMountedRef.current) return;

      onChange({
        blob: compressed.blob,
        thumbnailBlob,
        durationSeconds: compressed.durationSeconds,
        width: compressed.width,
        height: compressed.height,
        videoFormat: compressed.videoFormat,
        localPreviewUrl: URL.createObjectURL(compressed.blob),
        thumbnailTime: posterTime,
      });
      if (thumbnailBlob) {
        setThumbnailPreviewUrl(URL.createObjectURL(thumbnailBlob));
      }
      setStage('ready');
    } catch (caught) {
      if (!isMountedRef.current) return;
      const code = caught instanceof VideoCompressionError ? caught.code : 'encode-failed';
      const detail = caught instanceof Error ? caught.message : String(caught);

      setInternalError(t(`newFigure.upload.errors.${ERROR_KEY_BY_CODE[code]}`));
      // Shown because these failures depend on the device's codec support, and
      // "try another video" alone leaves the user with nothing to report.
      setErrorDetail(code === 'too-long' ? null : detail);
      setStage('idle');

      // The only visibility in production: drop_console strips console.error.
      trackEvent(posthog, AnalyticsEvents.VIDEO_UPLOAD_FAILED, {
        stage: 'compression',
        code,
        message: detail,
        fileType: file.type,
        fileSizeBytes: file.size,
      });
    }
  };

  /**
   * Re-captures the poster from wherever the viewer paused the preview. The
   * video's own timeline is the scrubber, so no second slider is needed.
   */
  const handleCaptureFrame = async () => {
    const element = previewRef.current;
    if (!element || !value) return;

    const atSeconds = element.currentTime;
    setIsCapturingFrame(true);
    try {
      const thumbnailBlob = await extractThumbnail(value.blob, atSeconds);
      if (!isMountedRef.current) return;
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl(URL.createObjectURL(thumbnailBlob));
      onChange({ ...value, thumbnailBlob, thumbnailTime: atSeconds });
    } catch {
      // Keep the existing poster; nothing is lost.
    } finally {
      if (isMountedRef.current) setIsCapturingFrame(false);
    }
  };

  const handleClear = () => {
    if (value) {
      URL.revokeObjectURL(value.localPreviewUrl);
    }
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl(null);
    }
    onChange(null);
    setStage('idle');
    setProgress(0);
    setInternalError(null);
    setErrorDetail(null);
  };

  const isBusy = stage === 'analyzing' || stage === 'compressing';
  const displayedError = internalError ?? error;

  return (
    <div className="space-y-2">
      <Label>
        {t('newFigure.sourceUpload')} {t('newFigure.required')}
      </Label>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        // No `capture` attribute on purpose: it forces the camera open and
        // removes the choice, when most people are picking an existing clip.
        // Without it, mobile shows the native chooser - camera, gallery or
        // files - so filming is still one tap away.
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isBusy}
      />

      {value && stage === 'ready' ? (
        <div className="space-y-2">
          <video
            ref={previewRef}
            src={value.localPreviewUrl}
            className="max-h-64 w-full rounded-md bg-black object-contain"
            controls
            playsInline
            preload="metadata"
          />

          {/* Poster picker. Thumbnail and hint share the first row; the button
              takes its own, since a narrow modal cannot fit all three without
              crushing the text to one word per line. */}
          <div className="space-y-3 rounded-md border border-input p-3">
            <p className="text-sm font-medium">{t('newFigure.upload.thumbnailLabel')}</p>

            <div className="flex items-center gap-3">
              {thumbnailPreviewUrl ? (
                <img
                  src={thumbnailPreviewUrl}
                  alt={t('newFigure.upload.thumbnailAlt')}
                  className="h-14 w-24 shrink-0 rounded bg-muted object-cover"
                />
              ) : (
                <div className="h-14 w-24 shrink-0 rounded bg-muted" />
              )}
              <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
                {t('newFigure.upload.thumbnailHint')}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCaptureFrame}
              disabled={disabled || isCapturingFrame}
            >
              {isCapturingFrame ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ImageDown className="mr-2 h-4 w-4" />
                  {t('newFigure.upload.captureFrame')}
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {t('newFigure.upload.ready', { size: formatBytes(value.blob.size) })}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="mr-1 h-4 w-4" />
              {t('newFigure.upload.changeFile')}
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 ${
            displayedError ? 'border-destructive' : 'border-input'
          }`}
        >
          {isBusy ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm font-medium">
                {stage === 'analyzing'
                  ? t('newFigure.upload.analyzing')
                  : t('newFigure.upload.compressing', { percent: Math.round(progress * 100) })}
              </p>
              {stage === 'compressing' && (
                <>
                  <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-[width] duration-200"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('newFigure.upload.compressingHint')}
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <Film className="h-8 w-8 text-muted-foreground" />
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t('newFigure.upload.pickFile')}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t('newFigure.upload.hint')}
              </p>
            </>
          )}
        </div>
      )}

      {displayedError && (
        <div className="space-y-1">
          <p className="flex items-start gap-1.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {displayedError}
          </p>
          {errorDetail && (
            <p className="break-words pl-[1.375rem] text-xs text-muted-foreground">{errorDetail}</p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t('newFigure.upload.privacyNotice')}</p>
    </div>
  );
}
