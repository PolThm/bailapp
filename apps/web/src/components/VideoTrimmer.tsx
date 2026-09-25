import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { VideoFormat } from '@/types';
import { Button } from '@/components/ui/button';
import { useEmbeddedPlayer, type EmbeddedVideoSource } from '@/hooks/useEmbeddedPlayer';
import { cn } from '@/lib/utils';
import { formatClockTime, parseTimeToSeconds } from '@/utils/timeParser';

const MIN_CLIP_SECONDS = 1;
const POLL_INTERVAL_MS = 100;

type Marker = 'start' | 'end' | 'preview';
type DragTarget = Marker | 'playhead';

interface VideoTrimmerProps {
  source: EmbeddedVideoSource;
  format?: VideoFormat;
  /** MM:SS, or empty to sit on the default bound. */
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
  /** Bounds an empty start/end stands for; the whole video when absent. */
  defaultStart?: string;
  defaultEnd?: string;
  /** Adds a third marker when provided. */
  previewStart?: string;
  onPreviewStartChange?: (value: string) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const toSeconds = (value?: string) => (value ? parseTimeToSeconds(value) : null);

export function VideoTrimmer({
  source,
  format = 'classic',
  start,
  end,
  onChange,
  defaultStart,
  defaultEnd,
  previewStart,
  onPreviewStartChange,
}: VideoTrimmerProps) {
  const { t } = useTranslation();
  const youtubeHostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { status, duration, getCurrentTime, seek, playFrom, pause } = useEmbeddedPlayer(
    source,
    youtubeHostRef,
    videoRef
  );

  const [currentTime, setCurrentTime] = useState(0);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const dragRef = useRef<{ target: DragTarget; offset: number; position: number } | null>(null);
  const isPlayingClipRef = useRef(false);
  const clipEndRef = useRef(0);

  const fallbackStart = clamp(toSeconds(defaultStart) ?? 0, 0, duration);
  const fallbackEnd = clamp(toSeconds(defaultEnd) ?? duration, 0, duration);
  const startSeconds = clamp(
    toSeconds(start) ?? fallbackStart,
    0,
    Math.max(0, duration - MIN_CLIP_SECONDS)
  );
  const endSeconds = clamp(
    toSeconds(end) ?? fallbackEnd,
    startSeconds + MIN_CLIP_SECONDS,
    duration
  );
  const previewSeconds = toSeconds(previewStart);

  useEffect(() => {
    clipEndRef.current = endSeconds;
  }, [endSeconds]);

  // Follows the player, and stops a clip preview at its end
  useEffect(() => {
    if (status !== 'ready') return;
    const intervalId = setInterval(() => {
      if (dragRef.current) return;
      const time = getCurrentTime();
      setCurrentTime(time);
      if (isPlayingClipRef.current && time >= clipEndRef.current) {
        isPlayingClipRef.current = false;
        pause();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [status, getCurrentTime, pause]);

  const percent = (seconds: number) =>
    duration > 0 ? (clamp(seconds, 0, duration) / duration) * 100 : 0;

  // An empty value keeps meaning "the default bound", so it is stored as such
  const emitRange = (nextStart: number, nextEnd: number) =>
    onChange({
      start: nextStart === fallbackStart ? '' : formatClockTime(nextStart),
      end: nextEnd === fallbackEnd ? '' : formatClockTime(nextEnd),
    });

  const moveMarker = (marker: Marker, seconds: number): number => {
    const rounded = Math.round(seconds);
    if (marker === 'start') {
      const next = clamp(rounded, 0, endSeconds - MIN_CLIP_SECONDS);
      emitRange(next, endSeconds);
      return next;
    }
    if (marker === 'end') {
      const next = clamp(rounded, startSeconds + MIN_CLIP_SECONDS, duration);
      emitRange(startSeconds, next);
      return next;
    }
    const next = clamp(rounded, startSeconds, endSeconds);
    onPreviewStartChange?.(formatClockTime(next));
    return next;
  };

  const moveTo = (target: DragTarget, seconds: number, final: boolean) => {
    isPlayingClipRef.current = false;
    const position =
      target === 'playhead' ? clamp(seconds, 0, duration) : moveMarker(target, seconds);
    if (dragRef.current) dragRef.current.position = position;
    setCurrentTime(position);
    seek(position, final);
  };

  const secondsAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return clamp((clientX - rect.left) / rect.width, 0, 1) * duration;
  };

  const markerSeconds = (marker: Marker) =>
    marker === 'start' ? startSeconds : marker === 'end' ? endSeconds : (previewSeconds ?? 0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (status !== 'ready') return;
    const marker = (e.target as HTMLElement).closest<HTMLElement>('[data-marker]')?.dataset
      .marker as Marker | undefined;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pointerSeconds = secondsAt(e.clientX);

    if (marker) {
      // Keeps the grab point under the finger instead of snapping the marker to it
      const offset = pointerSeconds - markerSeconds(marker);
      dragRef.current = { target: marker, offset, position: markerSeconds(marker) };
      setDragTarget(marker);
    } else {
      dragRef.current = { target: 'playhead', offset: 0, position: pointerSeconds };
      setDragTarget('playhead');
      moveTo('playhead', pointerSeconds, false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    moveTo(drag.target, secondsAt(e.clientX) - drag.offset, false);
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragTarget(null);
    seek(drag.position, true);
  };

  const handleMarkerKeyDown = (marker: Marker) => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    const current = markerSeconds(marker);
    const next =
      e.key === 'ArrowLeft' || e.key === 'ArrowDown'
        ? current - step
        : e.key === 'ArrowRight' || e.key === 'ArrowUp'
          ? current + step
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? duration
              : null;
    if (next === null) return;
    e.preventDefault();
    moveTo(marker, next, true);
  };

  const markStart = () => {
    const time = Math.round(getCurrentTime());
    if (time > endSeconds - MIN_CLIP_SECONDS) {
      emitRange(clamp(time, 0, duration - MIN_CLIP_SECONDS), duration);
    } else {
      moveMarker('start', time);
    }
  };

  const markEnd = () => {
    const time = Math.round(getCurrentTime());
    if (time < startSeconds + MIN_CLIP_SECONDS) {
      emitRange(0, clamp(time, MIN_CLIP_SECONDS, duration));
    } else {
      moveMarker('end', time);
    }
  };

  const playClip = () => {
    isPlayingClipRef.current = true;
    setCurrentTime(startSeconds);
    playFrom(startSeconds);
  };

  const markerProps = (marker: Marker, label: string, seconds: number) => ({
    'data-marker': marker,
    role: 'slider',
    tabIndex: 0,
    'aria-label': label,
    'aria-valuemin': 0,
    'aria-valuemax': duration,
    'aria-valuenow': seconds,
    'aria-valuetext': formatClockTime(seconds),
    onKeyDown: handleMarkerKeyDown(marker),
  });

  return (
    <div className="space-y-3">
      {/* Player */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg bg-black',
          format === 'short' ? 'mx-auto aspect-[9/16] h-[45vh] max-w-full' : 'aspect-video w-full'
        )}
      >
        {source.kind === 'youtube' ? (
          <div ref={youtubeHostRef} className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full" />
        ) : (
          <video
            ref={videoRef}
            src={source.url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
          />
        )}
        {status === 'loading' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white/80" />
          </div>
        )}
      </div>

      {status === 'error' && (
        <p className="text-sm text-destructive">{t('videoTrimmer.loadFailed')}</p>
      )}

      {status === 'loading' && <div className="mx-5 h-12 animate-pulse rounded-md bg-muted" />}

      {status === 'ready' && (
        <>
          {/* Timeline: padding matches the part of the handles outside the track */}
          <div className="px-5">
            <div
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative h-12 cursor-pointer touch-none select-none rounded-md bg-muted"
            >
              <div
                className="absolute inset-y-0 border-y-2 border-primary bg-primary/15"
                style={{
                  left: `${percent(startSeconds)}%`,
                  width: `${percent(endSeconds) - percent(startSeconds)}%`,
                }}
              />

              {/* Handles straddle the edge: 20px outside for the bracket, 16px inside for grip */}
              <div
                {...markerProps('start', t('videoTrimmer.start'), startSeconds)}
                className="group absolute inset-y-0 z-10 w-9 -translate-x-5 cursor-ew-resize outline-none"
                style={{ left: `${percent(startSeconds)}%` }}
              >
                <div
                  className={cn(
                    'absolute inset-y-0 left-1.5 flex w-3.5 items-center justify-center rounded-l-md bg-primary ring-ring ring-offset-1 ring-offset-background group-focus-visible:ring-2',
                    dragTarget === 'start' && 'brightness-110'
                  )}
                >
                  <div className="h-4 w-0.5 rounded-full bg-primary-foreground/80" />
                </div>
              </div>

              <div
                {...markerProps('end', t('videoTrimmer.end'), endSeconds)}
                className="group absolute inset-y-0 z-10 w-9 -translate-x-4 cursor-ew-resize outline-none"
                style={{ left: `${percent(endSeconds)}%` }}
              >
                <div
                  className={cn(
                    'absolute inset-y-0 right-1.5 flex w-3.5 items-center justify-center rounded-r-md bg-primary ring-ring ring-offset-1 ring-offset-background group-focus-visible:ring-2',
                    dragTarget === 'end' && 'brightness-110'
                  )}
                >
                  <div className="h-4 w-0.5 rounded-full bg-primary-foreground/80" />
                </div>
              </div>

              {onPreviewStartChange && previewSeconds !== null && (
                <div
                  {...markerProps('preview', t('videoTrimmer.preview'), previewSeconds)}
                  className="group absolute inset-y-0 z-20 flex w-6 -translate-x-1/2 cursor-ew-resize justify-center outline-none"
                  style={{ left: `${percent(previewSeconds)}%` }}
                >
                  <div className="h-full w-0.5 bg-sky-500" />
                  <div className="absolute -bottom-1.5 h-3 w-3 rotate-45 rounded-[2px] bg-sky-500 ring-ring ring-offset-1 ring-offset-background group-focus-visible:ring-2" />
                </div>
              )}

              {/* Playhead */}
              <div
                className="pointer-events-none absolute -bottom-1 -top-1 z-30 w-0.5 -translate-x-1/2 rounded-full bg-foreground shadow"
                style={{ left: `${percent(currentTime)}%` }}
              />
            </div>

            <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-muted-foreground">
              <span>{formatClockTime(0)}</span>
              <span className="font-medium text-foreground">{formatClockTime(currentTime)}</span>
              <span>{formatClockTime(duration)}</span>
            </div>
          </div>

          {/* Bounds and clip preview */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <BoundReadout
              label={t('videoTrimmer.start')}
              seconds={startSeconds}
              onNudge={(delta) => moveTo('start', startSeconds + delta, true)}
            />
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={playClip}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90"
                aria-label={t('videoTrimmer.playClip')}
              >
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </button>
              <span className="mt-1 text-xs tabular-nums text-muted-foreground">
                {formatClockTime(endSeconds - startSeconds)}
              </span>
            </div>
            <BoundReadout
              label={t('videoTrimmer.end')}
              seconds={endSeconds}
              onNudge={(delta) => moveTo('end', endSeconds + delta, true)}
              alignEnd
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markStart}
              className="flex-1"
            >
              <ArrowLeftToLine className="mr-1.5 h-4 w-4" />
              {t('videoTrimmer.setStart')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={markEnd} className="flex-1">
              {t('videoTrimmer.setEnd')}
              <ArrowRightToLine className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          {onPreviewStartChange && (
            <div className="flex items-center gap-3 rounded-md border border-dashed border-input px-3 py-2">
              <span className="h-2.5 w-2.5 shrink-0 rotate-45 rounded-[2px] bg-sky-500" />
              <div className="min-w-0 flex-1">
                <div className="text-sm">
                  {t('videoTrimmer.preview')}{' '}
                  <span className="font-medium tabular-nums">
                    {previewSeconds !== null ? formatClockTime(previewSeconds) : '—'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('newFigure.previewStartTimeHint')}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveMarker('preview', getCurrentTime())}
                className="w-auto shrink-0 px-3 sm:w-auto"
              >
                {t('videoTrimmer.setPreview')}
              </Button>
              {previewSeconds !== null && (
                <button
                  type="button"
                  onClick={() => onPreviewStartChange('')}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={t('videoTrimmer.clearPreview')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BoundReadout({
  label,
  seconds,
  onNudge,
  alignEnd = false,
}: {
  label: string;
  seconds: number;
  onNudge: (delta: number) => void;
  alignEnd?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-col', alignEnd ? 'items-end' : 'items-start')}>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-0.5 inline-flex h-8 items-center rounded-md border border-input">
        <button
          type="button"
          onClick={() => onNudge(-1)}
          className="flex h-full w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={t('common.decreaseTime')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[3rem] text-center text-sm font-medium tabular-nums">
          {formatClockTime(seconds)}
        </span>
        <button
          type="button"
          onClick={() => onNudge(1)}
          className="flex h-full w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={t('common.increaseTime')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
