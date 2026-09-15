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
    };

    if (!data.title) {
      return null;
    }

    return {
      title: data.title,
      authorName: data.author_name ?? '',
      thumbnailUrl: data.thumbnail_url ?? '',
    };
  } catch {
    // Offline or blocked: the user can still type the title by hand.
    return null;
  }
}
