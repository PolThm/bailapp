import { useEffect, useState } from 'react';
import { useNetworkQuality } from './useNetworkQuality';
import { useAuth } from '@/context/AuthContext';

interface OfflineStatus {
  isOffline: boolean;
  isVerySlowConnection: boolean;
  shouldUseCache: boolean; // Use cache for moderate or worse connections
  shouldShowWarning: boolean;
}

export function useOfflineStatus(): OfflineStatus {
  const networkQuality = useNetworkQuality();
  const { forceSlowMode } = useAuth();
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
  // If forceSlowMode is true (auth timeout), treat as very slow connection
  const isVerySlowConnection = forceSlowMode || networkQuality.slowLevel === 'very';
  // Use cache for moderate, slight, or very slow connections, when offline, or when forceSlowMode is active
  const shouldUseCache = forceSlowMode || isOffline || ['moderate', 'slight', 'very'].includes(networkQuality.slowLevel);
  const shouldShowWarning = forceSlowMode || isOffline || ['moderate', 'slight', 'very'].includes(networkQuality.slowLevel);

  return {
    isOffline,
    isVerySlowConnection,
    shouldUseCache,
    shouldShowWarning,
  };
}

