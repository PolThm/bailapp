/**
 * Limits and encode targets for user-uploaded figure videos.
 *
 * Raising the duration cap is a one-line change here, but the size cap in
 * `storage.rules` must move with it or uploads will be rejected server-side.
 */

/** Hard cap on the duration of an uploaded video. */
export const MAX_VIDEO_DURATION_SECONDS = 300; // 5 minutes

/**
 * Hard cap on the size of the file actually sent to Storage.
 * Must stay in sync with the `request.resource.size` check in storage.rules.
 */
export const MAX_VIDEO_FILE_SIZE_BYTES = 150 * 1024 * 1024;

/**
 * The short side of the output is capped at 720px, so landscape videos come
 * out 1280x720 and portrait ones 720x1280 — same pixel budget either way,
 * which keeps a single bitrate target honest.
 */
export const TARGET_VIDEO_SHORT_SIDE_PX = 720;

/** ~1.8 Mbps video + 96 kbps audio lands a full 5 minutes at roughly 70 MB. */
export const TARGET_VIDEO_BITRATE = 1_800_000;
export const TARGET_AUDIO_BITRATE = 96_000;

/** Where the generated poster frame is grabbed, when no previewStartTime is set. */
export const THUMBNAIL_CAPTURE_FALLBACK_SECONDS = 1;
