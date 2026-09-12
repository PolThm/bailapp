import { THUMBNAIL_CAPTURE_FALLBACK_SECONDS } from '@/lib/video/constants';

/**
 * Grabs a poster frame from a video blob.
 *
 * YouTube figures get their thumbnail for free — `getYouTubeThumbnail` just
 * synthesises a URL from the video id. A self-hosted file has no equivalent,
 * so one is captured here at upload time and stored alongside the video.
 */

const LOAD_TIMEOUT_MS = 15_000;
const SEEK_TIMEOUT_MS = 15_000;
const JPEG_QUALITY = 0.8;

function waitForEvent(
  element: HTMLVideoElement,
  eventName: 'loadeddata' | 'seeked',
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeoutId);
      element.removeEventListener(eventName, onSuccess);
      element.removeEventListener('error', onError);
    };
    const onSuccess = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Video failed while waiting for "${eventName}"`));
    };
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for "${eventName}"`));
    }, timeoutMs);

    element.addEventListener(eventName, onSuccess);
    element.addEventListener('error', onError);
  });
}

export async function extractThumbnail(
  videoBlob: Blob,
  captureAtSeconds: number = THUMBNAIL_CAPTURE_FALLBACK_SECONDS
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(videoBlob);
  const video = document.createElement('video');
  // muted + playsInline keep mobile Safari willing to decode a frame without
  // a user gesture.
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = objectUrl;

  try {
    await waitForEvent(video, 'loadeddata', LOAD_TIMEOUT_MS);

    // Seeking at or past the end never fires `seeked`, so stay just inside it.
    const maxSeekable = Number.isFinite(video.duration) ? Math.max(video.duration - 0.1, 0) : 0;
    const target = Math.min(Math.max(captureAtSeconds, 0), maxSeekable);

    if (Math.abs(video.currentTime - target) > 0.01) {
      const seeked = waitForEvent(video, 'seeked', SEEK_TIMEOUT_MS);
      video.currentTime = target;
      await seeked;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (!canvas.width || !canvas.height) {
      throw new Error('Video reported no dimensions');
    }

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not acquire a 2D canvas context');
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
    });

    if (!blob) {
      throw new Error('Canvas produced no image');
    }

    return blob;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
