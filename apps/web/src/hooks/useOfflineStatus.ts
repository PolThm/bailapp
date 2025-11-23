import { useEffect, useState } from 'react';
import { useNetworkQuality } from './useNetworkQuality';

interface OfflineStatus {
  isOffline: boolean;
  isVerySlowConnection: boolean;
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
  const shouldShowWarning = isOffline || isVerySlowConnection;

  return {
    isOffline,
    isVerySlowConnection,
    shouldShowWarning,
  };
}

