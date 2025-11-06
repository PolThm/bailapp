/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
    /youtube\.com\/watch\?.*v=([^&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Get YouTube embed URL with optional start and end times
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  startTime?: string,
  endTime?: string
): string {
  let url = `https://www.youtube.com/embed/${videoId}?`;

  const params: string[] = [];

  if (startTime) {
    const startSeconds = parseTimeToSeconds(startTime);
    if (startSeconds !== null) {
      params.push(`start=${startSeconds}`);
    }
  }

  if (endTime) {
    const endSeconds = parseTimeToSeconds(endTime);
    if (endSeconds !== null) {
      params.push(`end=${endSeconds}`);
    }
  }

  return url + params.join('&');
}

/**
 * Get YouTube preview video URL (autoplay, muted, loop, no controls)
 * Used for hover previews like on YouTube's website
 * Preview starts 15 seconds after the original start time (or at 15 seconds if no start time)
 */
export function getYouTubePreviewUrl(
  videoId: string,
  startTime?: string,
  endTime?: string
): string {
  let url = `https://www.youtube.com/embed/${videoId}?`;

  const params: string[] = [
    'autoplay=1',
    'mute=1',
    'loop=1',
    'controls=0',
    'modestbranding=1',
    'playsinline=1',
    'rel=0',
  ];

  // Calculate preview start time (15 seconds after original start, or 15 seconds if no start time)
  let previewStartSeconds = 15; // Default: start at 15 seconds
  if (startTime) {
    const startSeconds = parseTimeToSeconds(startTime);
    if (startSeconds !== null) {
      previewStartSeconds = startSeconds + 15;
    }
  }

  // Ensure we don't exceed endTime if it exists
  if (endTime) {
    const endSeconds = parseTimeToSeconds(endTime);
    if (endSeconds !== null && previewStartSeconds >= endSeconds) {
      // If preview start would exceed end time, start a bit before end time
      previewStartSeconds = Math.max(0, endSeconds - 5);
    }
    params.push(`start=${previewStartSeconds}`);
    params.push(`end=${endSeconds}`);
    // For looping to work with end time, we need to use playlist parameter
    params.push(`playlist=${videoId}`);
  } else {
    params.push(`start=${previewStartSeconds}`);
    // For looping without end time, we still need playlist parameter
    params.push(`playlist=${videoId}`);
  }

  return url + params.join('&');
}

/**
 * Parse time string to seconds
 * Supports formats: "1:30", "0:16", "01:30:45"
 */
function parseTimeToSeconds(time: string): number | null {
  const parts = time.split(':').map((p) => parseInt(p, 10));

  if (parts.some(isNaN)) {
    return null;
  }

  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return null;
}

