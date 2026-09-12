import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type StorageReference,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { MAX_VIDEO_FILE_SIZE_BYTES } from '@/lib/video/constants';

/**
 * Firebase Storage access for user-uploaded figure videos.
 *
 * Deliberately the only module that talks to Storage, so swapping the host
 * later (R2 and its zero egress fees being the obvious candidate if the public
 * catalogue ever takes off) means rewriting this file rather than the app.
 */

export interface FigureUploadResult {
  videoUrl: string;
  thumbnailUrl: string;
  storagePath: string;
}

export interface FigureUploadOptions {
  /** Receives 0..1 across the whole upload. */
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

/** The video dominates the transfer; the thumbnail is a rounding error. */
const VIDEO_PROGRESS_SHARE = 0.97;

export function getFigureStoragePath(userId: string, figureId: string): string {
  return `userVideos/${userId}/${figureId}`;
}

function uploadBlob(
  storageRef: StorageReference,
  blob: Blob,
  contentType: string,
  options?: { onProgress?: (progress: number) => void; signal?: AbortSignal }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, { contentType });

    const onAbort = () => task.cancel();
    options?.signal?.addEventListener('abort', onAbort, { once: true });

    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          options?.onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes);
        }
      },
      (error) => {
        options?.signal?.removeEventListener('abort', onAbort);
        reject(error);
      },
      () => {
        options?.signal?.removeEventListener('abort', onAbort);
        getDownloadURL(task.snapshot.ref).then(resolve, reject);
      }
    );
  });
}

/**
 * Uploads the video and its poster frame, returning capability URLs.
 *
 * Note these download URLs carry an unguessable token and bypass Storage
 * rules by design: anyone holding the link can watch, exactly like an
 * "unlisted" YouTube video. The URLs themselves are only ever handed out
 * through Firestore, which is rule-protected.
 */
export async function uploadFigureVideoToStorage(
  userId: string,
  figureId: string,
  video: Blob,
  thumbnail: Blob,
  options?: FigureUploadOptions
): Promise<FigureUploadResult> {
  try {
    if (video.size > MAX_VIDEO_FILE_SIZE_BYTES) {
      // Storage rules reject this too; failing here gives a usable message.
      throw new Error(
        `Video is ${video.size} bytes, over the ${MAX_VIDEO_FILE_SIZE_BYTES} byte limit`
      );
    }

    const storagePath = getFigureStoragePath(userId, figureId);

    const videoUrl = await uploadBlob(
      ref(storage, `${storagePath}/video.mp4`),
      video,
      'video/mp4',
      {
        onProgress: (progress) => options?.onProgress?.(progress * VIDEO_PROGRESS_SHARE),
        signal: options?.signal,
      }
    );

    const thumbnailUrl = await uploadBlob(
      ref(storage, `${storagePath}/thumbnail.jpg`),
      thumbnail,
      'image/jpeg',
      {
        onProgress: (progress) =>
          options?.onProgress?.(VIDEO_PROGRESS_SHARE + progress * (1 - VIDEO_PROGRESS_SHARE)),
        signal: options?.signal,
      }
    );

    return { videoUrl, thumbnailUrl, storagePath };
  } catch (error) {
    console.error('Uploading figure video to Storage:', error);
    throw error;
  }
}

/**
 * Removes both objects. A missing object is not an error: this also runs to
 * clean up after a half-finished upload.
 */
export async function deleteFigureVideoFromStorage(storagePath: string): Promise<void> {
  const paths = [`${storagePath}/video.mp4`, `${storagePath}/thumbnail.jpg`];

  await Promise.all(
    paths.map(async (path) => {
      try {
        await deleteObject(ref(storage, path));
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code === 'storage/object-not-found') {
          return;
        }
        console.error('Deleting figure video from Storage:', error);
        throw error;
      }
    })
  );
}
