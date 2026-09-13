import type { VideoFormat } from '@/types';
import {
  MAX_VIDEO_DURATION_SECONDS,
  TARGET_AUDIO_BITRATE,
  TARGET_VIDEO_BITRATE,
  SHORT_MAX_DURATION_SECONDS,
  TARGET_VIDEO_SHORT_SIDE_PX,
} from '@/lib/video/constants';

/**
 * Browser-side video transcoding, built on WebCodecs via mediabunny.
 *
 * Phones routinely produce 4K H.265 files of several hundred megabytes for a
 * few minutes of footage, which is neither uploadable on mobile data nor
 * playable everywhere. Everything is normalised to 540p H.264 MP4 before it
 * ever reaches Storage.
 *
 * ffmpeg.wasm was deliberately not used: it needs SharedArrayBuffer, which
 * requires COOP/COEP cross-origin isolation, which would break every YouTube
 * iframe and img.youtube.com thumbnail in the catalogue.
 */

type MediabunnyModule = typeof import('mediabunny');

let mediabunnyPromise: Promise<MediabunnyModule> | null = null;

/**
 * Loaded on demand. Mediabunny is ~580 kB, and the overwhelming majority of
 * sessions never upload a video — bundling it statically pushed the main
 * chunk past 1.4 MB, which a mobile-first PWA cannot afford.
 */
function loadMediabunny(): Promise<MediabunnyModule> {
  mediabunnyPromise ??= import('mediabunny');
  return mediabunnyPromise;
}

export type VideoCompressionErrorCode =
  | 'unsupported-browser'
  | 'unreadable-file'
  | 'no-video-track'
  | 'too-long'
  | 'encode-failed';

export class VideoCompressionError extends Error {
  readonly code: VideoCompressionErrorCode;

  constructor(code: VideoCompressionErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'VideoCompressionError';
    this.code = code;
  }
}

export interface CompressedVideo {
  blob: Blob;
  durationSeconds: number;
  width: number;
  height: number;
  /** Portrait and at most a minute makes a short; everything else is a classic. */
  videoFormat: VideoFormat;
}

/**
 * Whether this browser can transcode at all: WebCodecs plus an H.264 encoder.
 * Roughly Chrome/Edge 94+, Safari 16.4+, Firefox 130+.
 */
export async function canCompressVideo(): Promise<boolean> {
  if (typeof window === 'undefined' || !('VideoEncoder' in window)) {
    return false;
  }

  try {
    const { canEncodeVideo } = await loadMediabunny();
    return await canEncodeVideo('avc');
  } catch {
    return false;
  }
}

/**
 * Shorts are portrait and at most a minute long. A portrait video that runs
 * longer is a perfectly valid classic, so orientation alone is not enough.
 */
export function isEligibleAsShort(width: number, height: number, durationSeconds: number): boolean {
  return height > width && durationSeconds <= SHORT_MAX_DURATION_SECONDS;
}

/** H.264 in 4:2:0 needs even dimensions. */
function toEvenPixels(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

/**
 * Reads the source's duration and dimensions without decoding it, so an
 * over-long file is rejected before any expensive work happens.
 */
export async function probeVideo(file: File): Promise<{
  durationSeconds: number;
  width: number;
  height: number;
}> {
  const { ALL_FORMATS, BlobSource, Input } = await loadMediabunny();
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });

  let track;
  let durationSeconds: number;
  try {
    track = await input.getPrimaryVideoTrack();
    durationSeconds = await input.computeDuration();
  } catch (error) {
    throw new VideoCompressionError(
      'unreadable-file',
      error instanceof Error ? error.message : undefined
    );
  }

  if (!track) {
    throw new VideoCompressionError('no-video-track');
  }

  return {
    durationSeconds,
    width: track.displayWidth,
    height: track.displayHeight,
  };
}

/**
 * Transcodes to a 540p H.264 MP4 with the moov atom up front, so the result
 * can be seeked and progressively streamed straight from a Storage URL.
 *
 * `onProgress` receives 0..1.
 */
export async function compressVideo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressedVideo> {
  if (!(await canCompressVideo())) {
    throw new VideoCompressionError('unsupported-browser');
  }

  const { durationSeconds, width: sourceWidth, height: sourceHeight } = await probeVideo(file);

  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    throw new VideoCompressionError(
      'too-long',
      `${Math.round(durationSeconds)}s exceeds the ${MAX_VIDEO_DURATION_SECONDS}s limit`
    );
  }

  // Only ever scale down: re-encoding a small video larger wastes bytes and
  // invents no detail.
  const shortSide = Math.min(sourceWidth, sourceHeight);
  const scale = shortSide > TARGET_VIDEO_SHORT_SIDE_PX ? TARGET_VIDEO_SHORT_SIDE_PX / shortSide : 1;
  const width = toEvenPixels(sourceWidth * scale);
  const height = toEvenPixels(sourceHeight * scale);

  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    Mp4OutputFormat,
    Output,
    Quality,
  } = await loadMediabunny();

  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  const target = new BufferTarget();
  const output = new Output({
    // 'in-memory' puts the moov atom before the media data. Without it the
    // browser must download the whole file before it can play or seek.
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  });

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      width,
      height,
      fit: 'contain',
      codec: 'avc',
      quality: new Quality({ bitrate: TARGET_VIDEO_BITRATE }),
    },
    audio: {
      // Codec deliberately unset: mediabunny picks one the container and this
      // browser can both handle, rather than failing on a hardcoded AAC.
      quality: new Quality({ bitrate: TARGET_AUDIO_BITRATE }),
    },
  });

  if (!conversion.isValid) {
    const reasons = conversion.discardedTracks.map((track) => track.reason).join(', ');
    throw new VideoCompressionError('encode-failed', reasons || 'Conversion reported as invalid');
  }

  if (onProgress) {
    conversion.onProgress = (progress) => onProgress(progress);
  }

  try {
    await conversion.execute();
  } catch (error) {
    throw new VideoCompressionError(
      'encode-failed',
      error instanceof Error ? error.message : undefined
    );
  }

  if (!target.buffer) {
    throw new VideoCompressionError('encode-failed', 'Conversion produced no output');
  }

  return {
    blob: new Blob([target.buffer], { type: 'video/mp4' }),
    durationSeconds,
    width,
    height,
    videoFormat: isEligibleAsShort(width, height, durationSeconds) ? 'short' : 'classic',
  };
}
