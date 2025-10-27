import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  showInstallPrompt: boolean;
  isInstalled: boolean;
  showManualInstructions: boolean;
  setShowManualInstructions: (show: boolean) => void;
  handleInstallClick: () => Promise<void>;
  handleDismiss: () => void;
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if the app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Check on iOS
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen to the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Don't show immediately, wait for the timeout
    };

    // Listen to the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Show install prompt after 2 seconds for both Android and iOS
    const timeoutId = setTimeout(() => {
      if (!isInstalled) {
        setShowInstallPrompt(true);
      }
    }, 3000);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, deferredPrompt]);

  const handleDismiss = useCallback(() => {
    // Clear auto-close timer
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  }, []);

  // Auto-close timer effect
  useEffect(() => {
    if (showInstallPrompt && !showManualInstructions) {
      // Clear any existing timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }

      // Set new timer for 30 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 30000);

      autoCloseTimerRef.current = timer;
    } else {
      // Clear timer if prompt is not showing or modal is open
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [showInstallPrompt, showManualInstructions, handleDismiss]);

  const handleInstallClick = async (): Promise<void> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
    } else {
      // For iOS/Safari, show instructions
      // Clear auto-close timer when opening modal
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      setShowManualInstructions(true);
    }
  };

  return {
    deferredPrompt,
    showInstallPrompt,
    isInstalled,
    showManualInstructions,
    setShowManualInstructions,
    handleInstallClick,
    handleDismiss,
  };
}
