// YouTube IFrame Player API: the subset of types the app uses, and a shared loader

export interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
}

export interface YTPlayerEvent {
  data: number;
}

interface YTPlayerOptions {
  videoId?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events: {
    onReady?: () => void;
    onStateChange?: (event: YTPlayerEvent) => void;
    onError?: (event: YTPlayerEvent) => void;
  };
}

interface YTPlayerConstructor {
  new (element: HTMLElement, options: YTPlayerOptions): YTPlayer;
}

export interface YTNamespace {
  Player: YTPlayerConstructor;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api';

let apiPromise: Promise<YTNamespace> | null = null;

/** Loads the API once; later callers share the same promise. */
export function loadYouTubeIframeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        if (window.YT) resolve(window.YT);
      };

      if (!document.querySelector(`script[src="${API_SRC}"]`)) {
        const tag = document.createElement('script');
        tag.src = API_SRC;
        document.head.appendChild(tag);
      }
    });
  }

  return apiPromise;
}
