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
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.preload = 'auto';

  // iOS will not fetch media for an element that is not in the document, and
  // ignores preload on one that never plays. Parking it off-screen - rather
  // than display:none, which iOS also treats as "no need to decode" - is what
  // makes loadeddata fire at all.
  video.style.position = 'fixed';
  video.style.opacity = '0';
  video.style.pointerEvents = 'none';
  video.style.width = '1px';
  video.style.height = '1px';
  video.style.left = '-1px';
  video.style.top = '-1px';
  document.body.appendChild(video);

  video.src = objectUrl;

  try {
    // load() is required on iOS: assigning src alone does not start fetching.
    video.load();

    // Nudging playback is what actually forces iOS to decode a frame. It is
    // paused again immediately; failure is fine, since desktop browsers reach
    // loadeddata on their own.
    const nudge = video.play();
    if (nudge) {
      await nudge.then(() => video.pause()).catch(() => undefined);
    }

    await waitForEvent(video, 'loadeddata', LOAD_TIMEOUT_MS);

    // Seeking at or past the end never fires `seeked`, so stay just inside it.
    const maxSeekable = Number.isFinite(video.duration) ? Math.max(video.duration - 0.1, 0) : 0;
    const target = Math.min(Math.max(captureAtSeconds, 0), maxSeekable);

    if (Math.abs(video.currentTime - target) > 0.01) {
      const seeked = waitForEvent(video, 'seeked', SEEK_TIMEOUT_MS);
      video.currentTime = target;
      // A seek that never completes should not cost the whole poster: fall
      // back to whatever frame is already decoded.
      await seeked.catch(() => undefined);
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
    video.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
