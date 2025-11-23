import { useEffect, useState } from 'react';
import { useNetworkQuality } from './useNetworkQuality';

interface OfflineStatus {
  isOffline: boolean;
  isVerySlowConnection: boolean;
  shouldUseCache: boolean; // Use cache for moderate or worse connections
  shouldShowWarning: boolean;
}

export function useOfflineStatus(): OfflineStatus {
  const networkQuality = useNetworkQuality();
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true; // Assume online if API not available
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isOffline = !isOnline;
  const isVerySlowConnection = networkQuality.slowLevel === 'very';
  // Use cache for moderate, slight, or very slow connections, or when offline
  const shouldUseCache = isOffline || ['moderate', 'slight', 'very'].includes(networkQuality.slowLevel);
  const shouldShowWarning = isOffline || ['moderate', 'slight', 'very'].includes(networkQuality.slowLevel);

  return {
    isOffline,
    isVerySlowConnection,
    shouldUseCache,
    shouldShowWarning,
  };
}

