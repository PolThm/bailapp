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

