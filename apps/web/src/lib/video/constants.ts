/**
 * Limits and encode targets for user-uploaded figure videos.
 *
 * Raising the duration cap is a one-line change here, but the size cap in
 * `storage.rules` must move with it or uploads will be rejected server-side.
 */

/** Hard cap on the duration of an uploaded video. */
export const MAX_VIDEO_DURATION_SECONDS = 300; // 5 minutes

/**
 * A short is a portrait video of at most a minute. Anything longer, or in
 * landscape, is a classic video — classics may be either orientation, so the
 * aspect ratio alone never decides the format.
 */
export const SHORT_MAX_DURATION_SECONDS = 60;

/**
 * Hard cap on the size of the file actually sent to Storage. Generous headroom
 * over the ~40 MB a full 5 minutes should produce, so an unusually noisy clip
 * is not rejected for being a little over budget.
 * Must stay in sync with the `request.resource.size` check in storage.rules.
 */
export const MAX_VIDEO_FILE_SIZE_BYTES = 100 * 1024 * 1024;

/**
 * The short side of the output is capped at 540px, so landscape videos come
 * out 960x540 and portrait ones 540x960 — same pixel budget either way, which
 * keeps a single bitrate target honest. Plenty for a dance figure watched on a
 * phone, where what matters is body movement rather than fine detail.
 */
export const TARGET_VIDEO_SHORT_SIDE_PX = 540;

/**
 * ~1.0 Mbps video + 96 kbps audio lands a full 5 minutes at roughly 40 MB.
 * 540p carries about half the pixels of 720p, so the bitrate drops with it.
 */
export const TARGET_VIDEO_BITRATE = 1_000_000;
export const TARGET_AUDIO_BITRATE = 96_000;

/** Where the generated poster frame is grabbed, when no previewStartTime is set. */
export const THUMBNAIL_CAPTURE_FALLBACK_SECONDS = 1;
