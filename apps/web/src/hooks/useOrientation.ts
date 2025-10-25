import { useState, useEffect } from 'react';

// Helper function to detect if device is mobile based on screen size
const getIsMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Use screen dimensions instead of window dimensions for iOS PWA reliability
  const screenWidth = window.screen?.width || window.innerWidth;
  const screenHeight = window.screen?.height || window.innerHeight;

  // Consider mobile if smallest dimension is less than 768px
  return Math.min(screenWidth, screenHeight) < 768;
};

// Helper function to detect landscape orientation
const getIsLandscapeMobile = (): boolean => {
  if (typeof window === 'undefined') return false;

  // First check if this is a mobile device
  if (!getIsMobileDevice()) return false;

  // Method 1: Use matchMedia (most reliable for modern browsers)
  if (window.matchMedia) {
    const landscapeMatch = window.matchMedia('(orientation: landscape)').matches;
    // Double-check with dimensions for iOS PWA reliability
    const dimensionCheck = getDimensionBasedOrientation();
    // Use matchMedia result unless dimensions strongly disagree
    return landscapeMatch || dimensionCheck;
  }

  // Method 2: Use screen.orientation API
  if (typeof screen !== 'undefined' && screen.orientation) {
    const type = screen.orientation.type;
    if (type) {
      return type.includes('landscape');
    }
    if (typeof screen.orientation.angle === 'number') {
      const angle = screen.orientation.angle;
      return angle === 90 || angle === -90 || angle === 270;
    }
  }

  // Method 3: Check window.orientation (for older iOS devices)
  if (typeof (window as any).orientation !== 'undefined') {
    return Math.abs((window as any).orientation) === 90;
  }

  // Method 4: Fallback to dimension-based check
  return getDimensionBasedOrientation();
};

// Dimension-based orientation check (more reliable for iOS PWA)
const getDimensionBasedOrientation = (): boolean => {
  if (typeof window === 'undefined') return false;

  // For iOS PWA, use multiple sources and take the most reliable one
  let width: number;
  let height: number;

  // Prefer visualViewport for iOS PWA (most accurate)
  if (window.visualViewport) {
    width = window.visualViewport.width;
    height = window.visualViewport.height;
  }
  // Fallback to screen dimensions (more reliable than window.inner* on iOS PWA)
  else if (window.screen?.width && window.screen?.height) {
    width = window.screen.width;
    height = window.screen.height;
  }
  // Last resort: window dimensions
  else {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  return width > height;
};

export function useOrientation() {
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(() => getIsLandscapeMobile());

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscapeMobile(getIsLandscapeMobile());
    };

    // For iOS PWA, we need multiple checks with different delays
    // because the viewport takes time to update after orientation change
    const updateOrientationWithRetries = () => {
      // Immediate check
      updateOrientation();

      // Check after 100ms (for fast devices)
      setTimeout(updateOrientation, 100);

      // Check after 300ms (for iOS PWA viewport update)
      setTimeout(updateOrientation, 300);

      // Final check after 500ms (to ensure viewport is stable)
      setTimeout(updateOrientation, 500);
    };

    // Initial check
    updateOrientation();

    // Use matchMedia listener (best for PWA)
    let mediaQueryList: MediaQueryList | null = null;
    let mediaQueryHandler: (() => void) | null = null;

    if (window.matchMedia) {
      mediaQueryList = window.matchMedia('(orientation: landscape)');
      mediaQueryHandler = updateOrientationWithRetries;

      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', mediaQueryHandler);
      } else if ((mediaQueryList as any).addListener) {
        (mediaQueryList as any).addListener(mediaQueryHandler);
      }
    }

    // visualViewport listener (most reliable for iOS PWA)
    let visualViewportHandler: (() => void) | null = null;
    if (window.visualViewport) {
      visualViewportHandler = updateOrientationWithRetries;
      window.visualViewport.addEventListener('resize', visualViewportHandler);
    }

    // Fallback event listeners
    window.addEventListener('resize', updateOrientationWithRetries);
    window.addEventListener('orientationchange', updateOrientationWithRetries);

    if (typeof screen !== 'undefined' && screen.orientation?.addEventListener) {
      screen.orientation.addEventListener('change', updateOrientationWithRetries);
    }

    return () => {
      if (mediaQueryList && mediaQueryHandler) {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', mediaQueryHandler);
        } else if ((mediaQueryList as any).removeListener) {
          (mediaQueryList as any).removeListener(mediaQueryHandler);
        }
      }

      if (window.visualViewport && visualViewportHandler) {
        window.visualViewport.removeEventListener('resize', visualViewportHandler);
      }

      window.removeEventListener('resize', updateOrientationWithRetries);
      window.removeEventListener('orientationchange', updateOrientationWithRetries);

      if (typeof screen !== 'undefined' && screen.orientation?.removeEventListener) {
        screen.orientation.removeEventListener('change', updateOrientationWithRetries);
      }
    };
  }, []);

  return { isLandscapeMobile };
}
