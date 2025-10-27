import { useEffect, useState } from 'react';

interface PWAUpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateSW: () => Promise<void>;
}

export function usePWAUpdate(): PWAUpdateState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check if app is ready to work offline
      if (navigator.serviceWorker.controller) {
        setOfflineReady(true);
      }

      // Listen for SW registration and updates
      navigator.serviceWorker.ready.then((registration) => {
        console.log('SW Ready:', registration);

        // Check for updates every 60 seconds
        const interval = setInterval(() => {
          registration.update();
        }, 60000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available, will update...');
                setNeedRefresh(true);
                
                // Auto-update after 3 seconds
                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              }
            });
          }
        });

        return () => clearInterval(interval);
      });

      // Listen for controlling SW changes (when SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('SW Controller changed, reloading...');
        window.location.reload();
      });
    }
  }, []);

  const updateSW = async (): Promise<void> => {
    window.location.reload();
  };

  return {
    needRefresh,
    offlineReady,
    updateSW,
  };
}
