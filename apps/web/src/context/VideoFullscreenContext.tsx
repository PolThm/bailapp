import { createContext, useContext, useState, ReactNode } from 'react';

interface VideoFullscreenContextType {
  isVideoFullscreen: boolean;
  setIsVideoFullscreen: (value: boolean) => void;
}

const VideoFullscreenContext = createContext<VideoFullscreenContextType | undefined>(undefined);

export function VideoFullscreenProvider({ children }: { children: ReactNode }) {
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

  return (
    <VideoFullscreenContext.Provider
      value={{
        isVideoFullscreen,
        setIsVideoFullscreen,
      }}
    >
      {children}
    </VideoFullscreenContext.Provider>
  );
}

export function useVideoFullscreen() {
  const context = useContext(VideoFullscreenContext);
  if (context === undefined) {
    throw new Error('useVideoFullscreen must be used within a VideoFullscreenProvider');
  }
  return context;
}

