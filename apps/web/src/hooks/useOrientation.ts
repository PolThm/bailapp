import { useState, useEffect } from 'react';

// Helper function to detect landscape mobile
const getIsLandscapeMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const isMobile = window.innerWidth < 768; // sm breakpoint
  if (!isMobile) return false;
  
  // Method 1: Use matchMedia (most reliable for PWA on iOS)
  if (window.matchMedia) {
    return window.matchMedia('(orientation: landscape)').matches;
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
  
  // Method 4: Fallback to window dimensions
  return window.innerWidth > window.innerHeight;
};

export function useOrientation() {
  const [isLandscapeMobile, setIsLandscapeMobile] = useState(() => getIsLandscapeMobile());

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscapeMobile(getIsLandscapeMobile());
    };

    const updateOrientationDelayed = () => {
      setTimeout(updateOrientation, 150);
    };

    updateOrientation();
    
    // Use matchMedia listener (best for PWA)
    let mediaQueryList: MediaQueryList | null = null;
    let mediaQueryHandler: (() => void) | null = null;
    
    if (window.matchMedia) {
      mediaQueryList = window.matchMedia('(orientation: landscape)');
      mediaQueryHandler = () => {
        setTimeout(updateOrientation, 150);
      };
      
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', mediaQueryHandler);
      } else if ((mediaQueryList as any).addListener) {
        (mediaQueryList as any).addListener(mediaQueryHandler);
      }
    }
    
    // Fallback event listeners
    window.addEventListener('resize', updateOrientationDelayed);
    window.addEventListener('orientationchange', updateOrientationDelayed);

    if (typeof screen !== 'undefined' && screen.orientation?.addEventListener) {
      screen.orientation.addEventListener('change', updateOrientationDelayed);
    }

    return () => {
      if (mediaQueryList && mediaQueryHandler) {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', mediaQueryHandler);
        } else if ((mediaQueryList as any).removeListener) {
          (mediaQueryList as any).removeListener(mediaQueryHandler);
        }
      }
      
      window.removeEventListener('resize', updateOrientationDelayed);
      window.removeEventListener('orientationchange', updateOrientationDelayed);
      
      if (typeof screen !== 'undefined' && screen.orientation?.removeEventListener) {
        screen.orientation.removeEventListener('change', updateOrientationDelayed);
      }
    };
  }, []);

  return { isLandscapeMobile };
}
