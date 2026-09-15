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
import { captureFrameFromElement, extractThumbnail } from '@/lib/video/extractThumbnail';

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
  /** Fires while the file is being read and converted, so the form can lock. */
  onProcessingChange?: (isProcessing: boolean) => void;
  /**
   * Format the figure will be published as. Comes from the modal because the
   * user may override what the video's own aspect ratio suggested.
   */
  format?: VideoFormat;
}

type Stage =
  /** Picker is open, or iOS is still exporting the asset from Photos. */
  'waiting' | 'idle' | 'analyzing' | 'compressing' | 'ready';

const ERROR_KEY_BY_CODE: Record<VideoCompressionErrorCode, string> = {
  'unsupported-browser': 'unsupportedBrowser',
  'unreadable-file': 'unreadableFile',
  'no-video-track': 'noVideoTrack',
  'cannot-decode': 'cannotDecode',
  'no-encoder': 'noEncoder',
  'too-long': 'tooLong',
  canceled: 'canceled',
  'encode-failed': 'encodeFailed',
};

export function VideoUploadField({
  value,
  onChange,
  error,
  disabled,
  format,
  onProcessingChange,
}: VideoUploadFieldProps) {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const busyPanelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
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
    if (!file) {
      setStage('idle');
      return;
    }

    if (value) {
      URL.revokeObjectURL(value.localPreviewUrl);
      onChange(null);
    }

    setInternalError(null);
    setErrorDetail(null);
    setProgress(0);
    setStage('analyzing');

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const compressed = await compressVideo(
        file,
        (ratio) => {
          if (!isMountedRef.current) return;
          setStage('compressing');
          setProgress(ratio);
        },
        controller.signal
      );

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

      if (code === 'canceled') {
        setStage('idle');
        setProgress(0);
        return;
      }

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
      // Read the frame off the element on screen: it is already decoded, so
      // nothing has to be loaded or seeked again. Decoding the file a second
      // time in a hidden element is the slow path, kept only as a fallback for
      // when the preview has not painted yet.
      const thumbnailBlob = await captureFrameFromElement(element).catch(() =>
        extractThumbnail(value.blob, atSeconds)
      );
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

  // Falls back to what the video itself suggests until the modal says otherwise.
  const previewFormat = format ?? value?.videoFormat ?? 'classic';

  const isBusy = stage === 'waiting' || stage === 'analyzing' || stage === 'compressing';

  // The file input's 'cancel' event fires when the picker is dismissed without
  // a choice, which must not strand the waiting stage. Attached natively since
  // React does not type it. Spec'd, and available from Safari 16.4 - the same
  // floor WebCodecs already sets for this feature.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const onCancel = () => setStage((current) => (current === 'waiting' ? 'idle' : current));
    input.addEventListener('cancel', onCancel);
    return () => input.removeEventListener('cancel', onCancel);
  }, []);

  // iOS keeps its picker up while it exports the clip from Photos, so the user
  // lands back in the form with work already running. Scrolling the panel into
  // view is what makes that visible instead of looking like nothing happened.
  useEffect(() => {
    // Deliberately not 'waiting': that stage depends on the picker's cancel
    // event to end, and a browser without it would leave the modal locked with
    // no way out. Only real work - which always terminates - locks the form.
    onProcessingChange?.(stage === 'analyzing' || stage === 'compressing');
    if (isBusy) {
      busyPanelRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [stage, isBusy, onProcessingChange]);
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
        disabled={disabled}
      />

      {value && stage === 'ready' ? (
        <div className="space-y-2">
          {/* The frame follows the chosen format, so the preview shows what
              other people will actually see. object-contain on a black ground
              letterboxes a portrait video inside a landscape frame instead of
              cropping into it. */}
          <div
            className={`mx-auto w-full overflow-hidden rounded-md bg-black ${
              previewFormat === 'short' ? 'aspect-[9/16] max-w-[15rem]' : 'aspect-video'
            }`}
          >
            <video
              ref={previewRef}
              src={value.localPreviewUrl}
              className="h-full w-full object-contain"
              controls
              playsInline
              muted
              preload="auto"
              // The generated thumbnail doubles as the opening image. Waiting for
              // the element to decode a frame was unreliable: loadedmetadata fires
              // before any video data exists, so the seek that was meant to paint
              // the first frame had nothing to seek into and the player stayed
              // black until first played.
              poster={thumbnailPreviewUrl ?? undefined}
              // Still nudge once real data arrives, so the element holds a decoded
              // frame for the capture button even if the poster is missing.
              onLoadedData={(e) => {
                const element = e.currentTarget;
                if (element.currentTime === 0 && element.duration > 0.1) {
                  element.currentTime = 0.05;
                }
              }}
            />
          </div>

          {/* Poster picker. Thumbnail and hint share the first row; the button
              takes its own, since a narrow modal cannot fit all three without
              crushing the text to one word per line. */}
          <div className="space-y-3 rounded-md border border-input p-3">
            <p className="text-sm font-medium">{t('newFigure.upload.thumbnailLabel')}</p>

            <div className="flex items-center gap-3">
              {/* Matches the card that will display it: portrait for a short,
                  landscape otherwise, cropped the same way. */}
              {thumbnailPreviewUrl ? (
                <img
                  src={thumbnailPreviewUrl}
                  alt={t('newFigure.upload.thumbnailAlt')}
                  className={`shrink-0 rounded bg-muted object-cover ${
                    previewFormat === 'short' ? 'h-20 w-[45px]' : 'h-14 w-24'
                  }`}
                />
              ) : (
                <div
                  className={`shrink-0 rounded bg-muted ${
                    previewFormat === 'short' ? 'h-20 w-[45px]' : 'h-14 w-24'
                  }`}
                />
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
          ref={busyPanelRef}
          className={`flex flex-col items-center justify-center gap-3 rounded-md border p-6 ${
            isBusy
              ? 'border-solid border-primary/50 bg-primary/5'
              : displayedError
                ? 'border-dashed border-destructive'
                : 'border-dashed border-input'
          }`}
        >
          {isBusy ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-base font-semibold text-primary">
                {stage === 'waiting'
                  ? t('newFigure.upload.waiting')
                  : stage === 'analyzing'
                    ? t('newFigure.upload.analyzing')
                    : t('newFigure.upload.compressing', { percent: Math.round(progress * 100) })}
              </p>
              {/* The bar is always present, indeterminate while analysing.
                  A spinner alone reads as "nothing is happening", which is
                  exactly the complaint on iOS, where the picker sits over the
                  form while the clip is exported from Photos. */}
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
                {stage === 'compressing' ? (
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200"
                    style={{ width: `${Math.max(2, Math.round(progress * 100))}%` }}
                  />
                ) : (
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {stage === 'waiting'
                  ? t('newFigure.upload.waitingHint')
                  : t('newFigure.upload.compressingHint')}
              </p>
              {stage !== 'waiting' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => abortRef.current?.abort()}
                >
                  {t('newFigure.upload.cancel')}
                </Button>
              )}
            </>
          ) : (
            <>
              <Film className="h-8 w-8 text-muted-foreground" />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInternalError(null);
                  setErrorDetail(null);
                  // Set before the picker opens, so control returning from it
                  // lands on a form that already says what is happening.
                  setStage('waiting');
                  inputRef.current?.click();
                }}
                disabled={disabled}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t('newFigure.upload.pickFile')}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {t('newFigure.upload.hint')}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {t('newFigure.upload.pickHint')}
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
