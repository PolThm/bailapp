import type { Figure, VideoFormat } from '@/types';
import { parseTimeToSeconds } from '@/utils/timeParser';
import {
  getYouTubeEmbedUrl,
  getYouTubePreviewUrl,
  getYouTubeShortPreviewUrl,
  getYouTubeThumbnail,
  getYouTubeVideoId,
  isYouTubeShort,
} from '@/utils/youtube';

/**
 * Source-agnostic accessors for a figure's video.
 *
 * The catalogue is YouTube-backed, but users can also upload their own videos
 * to Firebase Storage. Rendering code should go through these helpers instead
 * of reaching for `figure.youtubeUrl` directly, so that adding a source later
 * touches one module rather than every card and player.
 *
 * All YouTube behaviour is delegated unchanged to `@/utils/youtube`.
 */

export const PLACEHOLDER_THUMBNAIL = '/placeholder-video.jpg';

/** How much of an uploaded video a hover preview plays before looping. */
const UPLOAD_PREVIEW_DURATION_SECONDS = 8;

/** Default offset into a classic video where the preview starts, matching getYouTubePreviewUrl. */
const CLASSIC_PREVIEW_OFFSET_SECONDS = 10;

/**
 * How a figure's video should be rendered: YouTube needs an iframe, an upload
 * needs a native <video> element.
 */
export type FigureVideoTarget =
  | { kind: 'iframe'; url: string; videoId: string }
  | {
      kind: 'video';
      url: string;
      startSeconds: number | null;
      endSeconds: number | null;
    };

export function isUploadedFigure(figure: Figure): boolean {
  return figure.videoSource === 'upload';
}

/**
 * A figure that is not in the public catalogue: reachable only by link.
 * The ownerId check keeps the static catalogue out, since those are public.
 */
export function isUnlistedFigure(figure: Figure): boolean {
  return figure.visibility === 'unlisted' && Boolean(figure.ownerId);
}

/**
 * Classic vs short. Uploads carry it explicitly (derived from the video's own
 * aspect ratio); YouTube figures keep falling back to URL sniffing so the
 * static lists need no migration.
 */
export function getFigureVideoFormat(figure: Figure): VideoFormat {
  if (figure.videoFormat) {
    return figure.videoFormat;
  }
  return figure.youtubeUrl && isYouTubeShort(figure.youtubeUrl) ? 'short' : 'classic';
}

/**
 * Whether a figure's media should be letterboxed rather than cropped.
 *
 * True for an upload whose own shape does not match the format it is published
 * as - a portrait video posted as a classic, say. Cropping one of those into a
 * 16:9 frame zooms into the middle of the dancer; contain shows the whole
 * frame with bars down the sides.
 *
 * YouTube figures are excluded: their thumbnails are always 16:9 regardless of
 * the video, so cover is what fills the card cleanly.
 */
export function shouldLetterboxFigure(figure: Figure): boolean {
  if (!isUploadedFigure(figure) || !figure.width || !figure.height) {
    return false;
  }
  const isPortraitSource = figure.height > figure.width;
  const isPortraitFrame = getFigureVideoFormat(figure) === 'short';
  return isPortraitSource !== isPortraitFrame;
}

/**
 * Poster image. YouTube thumbnails are synthesised from the video id, while
 * uploads carry a frame captured at upload time.
 */
export function getFigureThumbnail(
  figure: Figure,
  quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'
): string {
  if (isUploadedFigure(figure)) {
    return figure.thumbnailUrl || PLACEHOLDER_THUMBNAIL;
  }

  const videoId = figure.youtubeUrl ? getYouTubeVideoId(figure.youtubeUrl) : null;
  return videoId ? getYouTubeThumbnail(videoId, quality) : PLACEHOLDER_THUMBNAIL;
}

/**
 * Where an uploaded video's preview should start, mirroring the YouTube rules:
 * shorts start at the beginning, classic videos skip ahead past the intro.
 */
function getUploadPreviewStartSeconds(figure: Figure): number {
  const startSeconds = (figure.startTime ? parseTimeToSeconds(figure.startTime) : null) ?? 0;
  const explicitPreviewStart = figure.previewStartTime
    ? parseTimeToSeconds(figure.previewStartTime)
    : null;

  if (explicitPreviewStart !== null) {
    return explicitPreviewStart;
  }

  return getFigureVideoFormat(figure) === 'short'
    ? startSeconds
    : startSeconds + CLASSIC_PREVIEW_OFFSET_SECONDS;
}

/** Muted, looping hover/scroll preview. Returns null when no video is playable. */
export function getFigurePreviewTarget(figure: Figure): FigureVideoTarget | null {
  if (isUploadedFigure(figure)) {
    if (!figure.videoUrl) {
      return null;
    }

    const endSeconds = figure.endTime ? parseTimeToSeconds(figure.endTime) : null;
    let startSeconds = getUploadPreviewStartSeconds(figure);

    // Never start past the end of the excerpt.
    if (endSeconds !== null && startSeconds >= endSeconds) {
      startSeconds = Math.max(0, endSeconds - UPLOAD_PREVIEW_DURATION_SECONDS);
    }

    const previewEnd = Math.min(
      startSeconds + UPLOAD_PREVIEW_DURATION_SECONDS,
      endSeconds ?? Number.POSITIVE_INFINITY
    );

    return {
      kind: 'video',
      // Media fragment, so the browser range-requests only the excerpt.
      url: `${figure.videoUrl}#t=${startSeconds},${previewEnd}`,
      startSeconds,
      endSeconds: previewEnd,
    };
  }

  const videoId = figure.youtubeUrl ? getYouTubeVideoId(figure.youtubeUrl) : null;
  if (!videoId) {
    return null;
  }

  const url =
    getFigureVideoFormat(figure) === 'short'
      ? getYouTubeShortPreviewUrl(
          videoId,
          figure.startTime,
          figure.endTime,
          figure.previewStartTime
        )
      : getYouTubePreviewUrl(videoId, figure.startTime, figure.endTime, figure.previewStartTime);

  return { kind: 'iframe', url, videoId };
}

/**
 * Full player on the figure detail page.
 *
 * For uploads, `startSeconds`/`endSeconds` are returned so the caller can
 * enforce the excerpt via the element's `currentTime` — the native equivalent
 * of the YouTube IFrame API polling used for iframes.
 */
export function getFigurePlayerTarget(figure: Figure): FigureVideoTarget | null {
  if (isUploadedFigure(figure)) {
    if (!figure.videoUrl) {
      return null;
    }

    const startSeconds = figure.startTime ? parseTimeToSeconds(figure.startTime) : null;
    const endSeconds = figure.endTime ? parseTimeToSeconds(figure.endTime) : null;

    return {
      kind: 'video',
      url: startSeconds ? `${figure.videoUrl}#t=${startSeconds}` : figure.videoUrl,
      startSeconds,
      endSeconds,
    };
  }

  const videoId = figure.youtubeUrl ? getYouTubeVideoId(figure.youtubeUrl) : null;
  if (!videoId) {
    return null;
  }

  return {
    kind: 'iframe',
    // endTime is deliberately not passed: the detail page enforces it through
    // the IFrame Player API so the video pauses rather than ending.
    url: getYouTubeEmbedUrl(videoId, figure.startTime, undefined, true),
    videoId,
  };
}
