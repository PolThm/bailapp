import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { loadYouTubeIframeApi, type YTNamespace, type YTPlayer } from '@/lib/youtubeIframeApi';

export type EmbeddedVideoSource =
  | { kind: 'youtube'; videoId: string }
  | { kind: 'file'; url: string };

export type EmbeddedPlayerStatus = 'loading' | 'ready' | 'error';

export interface EmbeddedPlayer {
  status: EmbeddedPlayerStatus;
  /** Whole seconds; 0 until the video's metadata is known. */
  duration: number;
  getCurrentTime: () => number;
  /** `final` marks the end of a scrub, so YouTube may fetch data it has not buffered. */
  seek: (seconds: number, final?: boolean) => void;
  playFrom: (seconds: number) => void;
  pause: () => void;
}

/**
 * One control surface over a YouTube embed or a native <video>.
 * YouTube mounts into `youtubeHostRef`, files play in `videoRef`.
 */
export function useEmbeddedPlayer(
  source: EmbeddedVideoSource,
  youtubeHostRef: RefObject<HTMLDivElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>
): EmbeddedPlayer {
  const [status, setStatus] = useState<EmbeddedPlayerStatus>('loading');
  const [duration, setDuration] = useState(0);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytRef = useRef<YTNamespace | null>(null);

  const youtubeId = source.kind === 'youtube' ? source.videoId : null;
  const fileUrl = source.kind === 'file' ? source.url : null;

  useEffect(() => {
    setStatus('loading');
    setDuration(0);
  }, [youtubeId, fileUrl]);

  // YouTube: the API replaces its target element, so it gets a node React does not own
  useEffect(() => {
    const host = youtubeHostRef.current;
    if (!youtubeId || !host) return;

    let cancelled = false;
    let durationPoll: ReturnType<typeof setInterval> | null = null;
    const target = document.createElement('div');
    host.appendChild(target);

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled) return;
      ytRef.current = YT;
      ytPlayerRef.current = new YT.Player(target, {
        videoId: youtubeId,
        width: '100%',
        height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            // Duration can read 0 until the metadata arrives
            durationPoll = setInterval(() => {
              const seconds = ytPlayerRef.current?.getDuration() ?? 0;
              if (seconds > 0) {
                if (durationPoll) clearInterval(durationPoll);
                setDuration(Math.floor(seconds));
                setStatus('ready');
              }
            }, 200);
          },
          onError: () => setStatus('error'),
        },
      });
    });

    return () => {
      cancelled = true;
      if (durationPoll) clearInterval(durationPoll);
      try {
        ytPlayerRef.current?.destroy();
      } catch {
        // Player may not have finished initialising
      }
      ytPlayerRef.current = null;
      host.innerHTML = '';
    };
  }, [youtubeId, youtubeHostRef]);

  // File: metadata and errors come from the element itself
  useEffect(() => {
    const element = videoRef.current;
    if (!fileUrl || !element) return;

    const handleMetadata = () => {
      if (Number.isFinite(element.duration) && element.duration > 0) {
        setDuration(Math.floor(element.duration));
        setStatus('ready');
      }
    };
    const handleError = () => setStatus('error');

    element.addEventListener('loadedmetadata', handleMetadata);
    element.addEventListener('durationchange', handleMetadata);
    element.addEventListener('error', handleError);
    handleMetadata();

    return () => {
      element.removeEventListener('loadedmetadata', handleMetadata);
      element.removeEventListener('durationchange', handleMetadata);
      element.removeEventListener('error', handleError);
    };
  }, [fileUrl, videoRef]);

  const getCurrentTime = useCallback(() => {
    if (source.kind === 'file') return videoRef.current?.currentTime ?? 0;
    try {
      return ytPlayerRef.current?.getCurrentTime() ?? 0;
    } catch {
      return 0;
    }
  }, [source.kind, videoRef]);

  const seek = useCallback(
    (seconds: number, final = false) => {
      if (source.kind === 'file') {
        if (videoRef.current) videoRef.current.currentTime = seconds;
        return;
      }
      const player = ytPlayerRef.current;
      const YT = ytRef.current;
      if (!player || !YT) return;
      // Seeking an unstarted YouTube video starts playback, so it waits for the first play
      const state = player.getPlayerState();
      if (state === YT.PlayerState.UNSTARTED || state === YT.PlayerState.CUED) return;
      player.seekTo(seconds, final);
    },
    [source.kind, videoRef]
  );

  const playFrom = useCallback(
    (seconds: number) => {
      if (source.kind === 'file') {
        const element = videoRef.current;
        if (!element) return;
        element.currentTime = seconds;
        element.play().catch(() => {
          // Autoplay policies can refuse; the native controls remain available
        });
      } else {
        ytPlayerRef.current?.seekTo(seconds, true);
        ytPlayerRef.current?.playVideo();
      }
    },
    [source.kind, videoRef]
  );

  const pause = useCallback(() => {
    if (source.kind === 'file') videoRef.current?.pause();
    else ytPlayerRef.current?.pauseVideo();
  }, [source.kind, videoRef]);

  return { status, duration, getCurrentTime, seek, playFrom, pause };
}
