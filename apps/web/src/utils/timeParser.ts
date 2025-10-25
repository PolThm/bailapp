/**
 * Parse time string to seconds
 * Supports formats: "1:30", "0:16", "01:30:45"
 */
export function parseTimeToSeconds(time: string): number | null {
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

/**
 * Format seconds to time string (MM:SS or HH:MM:SS)
 */
export function formatSecondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
