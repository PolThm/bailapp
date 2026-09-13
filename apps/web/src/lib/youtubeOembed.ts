import { getYouTubeVideoId } from '@/utils/youtube';

/**
 * Fetches a YouTube video's real title and channel name.
 *
 * Uses the public oEmbed endpoint, which needs no API key and sends CORS
 * headers, so it works straight from the browser. The Data API would need a
 * key shipped in the bundle and a quota, for strictly less than this.
 */

export interface YouTubeVideoMeta {
  title: string;
  authorName: string;
  thumbnailUrl: string;
  /**
   * oEmbed's width/height describe the player's aspect ratio, which mirrors
   * the video's: 113x200 for a portrait short, 200x113 for a landscape video.
   * Duration is not exposed, so short eligibility cannot be fully checked here.
   */
  isPortrait: boolean;
}

export async function fetchYouTubeMeta(
  url: string,
  signal?: AbortSignal
): Promise<YouTubeVideoMeta | null> {
  if (!getYouTubeVideoId(url)) {
    return null;
  }

  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(endpoint, { signal });
    if (!response.ok) {
      // 401/404 here means private, deleted, or embedding disabled.
      return null;
    }

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      width?: number;
      height?: number;
    };

    if (!data.title) {
      return null;
    }

    return {
      title: data.title,
      authorName: data.author_name ?? '',
      thumbnailUrl: data.thumbnail_url ?? '',
      isPortrait: (data.height ?? 0) > (data.width ?? 0),
    };
  } catch {
    // Offline or blocked: the user can still type the title by hand.
    return null;
  }
}
