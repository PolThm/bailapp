import { useState, useEffect } from 'react';

interface NetworkConnection {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData?: boolean;
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
}

type SlowConnectionLevel = 'none' | 'slight' | 'moderate' | 'very';

interface NetworkQuality {
  isSlow: boolean;
  slowLevel: SlowConnectionLevel;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  type: string | null;
  saveData: boolean;
}

export function useNetworkQuality(): NetworkQuality {
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>(() => {
    // Get initial connection info
    const connection = getConnection();
    return calculateNetworkQuality(connection);
  });

  useEffect(() => {
    const connection = getConnection();

    if (!connection) {
      // API not available, assume good connection
      setNetworkQuality({
        isSlow: false,
        slowLevel: 'none',
        effectiveType: null,
        downlink: null,
        rtt: null,
        type: null,
        saveData: false,
      });
      return;
    }

    // Set initial quality
    const initialQuality = calculateNetworkQuality(connection);
    setNetworkQuality(initialQuality);

    // Listen for connection changes
    const handleConnectionChange = () => {
      const updatedConnection = getConnection();
      if (updatedConnection) {
        const updatedQuality = calculateNetworkQuality(updatedConnection);
        setNetworkQuality(updatedQuality);
      }
    };

    connection.addEventListener('change', handleConnectionChange);

    return () => {
      connection.removeEventListener('change', handleConnectionChange);
    };
  }, []);

  return networkQuality;
}

function getConnection():
  | (NetworkConnection & {
      addEventListener: (event: string, handler: () => void) => void;
      removeEventListener: (event: string, handler: () => void) => void;
    })
  | null {
  if (typeof navigator === 'undefined') return null;

  // Try different browser implementations
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection ||
    null;

  return connection;
}

function calculateNetworkQuality(connection: NetworkConnection | null): NetworkQuality {
  if (!connection) {
    return {
      isSlow: false,
      slowLevel: 'none',
      effectiveType: null,
      downlink: null,
      rtt: null,
      type: null,
      saveData: false,
    };
  }

  const effectiveType = connection.effectiveType;
  const downlink = connection.downlink;
  const rtt = connection.rtt;
  const type = connection.type;
  const saveData = connection.saveData || false;

  // Detect if we're on desktop (non-mobile)
  const isMobile =
    /iPad|iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && navigator.maxTouchPoints > 0);
  const isDesktop = !isMobile;

  // Determine connection slow level
  // Priority: downlink > effectiveType > type
  let slowLevel: SlowConnectionLevel = 'none';
  let isSlow = false;

  // Override: if saveData is enabled, consider it very slow
  if (saveData) {
    slowLevel = 'very';
    isSlow = true;
  } else if (isDesktop) {
    // On desktop, be more permissive with connection quality
    // Desktop connections often have unreliable downlink values from the API
    const isWifiOrEthernet = type === 'wifi' || type === 'ethernet' || type === undefined;
    const hasGoodEffectiveType = effectiveType === '4g';
    const hasLowRTT = rtt !== undefined && rtt < 200;

    if (isWifiOrEthernet && (hasGoodEffectiveType || hasLowRTT)) {
      // Desktop with WiFi/Ethernet (or undefined type) and good indicators
      // Only consider it slow if downlink is extremely low (< 1 Mbps) or RTT is very high (> 1000ms)
      if (downlink !== undefined && downlink < 1) {
        slowLevel = 'very';
        isSlow = true;
      } else if (rtt !== undefined && rtt > 1000) {
        slowLevel = 'moderate';
        isSlow = true;
      } else {
        // Desktop with good indicators is generally good, even with lower downlink values
        slowLevel = 'none';
        isSlow = false;
      }
    } else if (downlink !== undefined) {
      // Desktop but without good indicators, use downlink classification
      if (downlink < 5) {
        slowLevel = 'very';
        isSlow = true;
      } else if (downlink < 6) {
        slowLevel = 'moderate';
        isSlow = true;
      } else if (downlink < 8) {
        slowLevel = 'slight';
        isSlow = true;
      } else {
        slowLevel = 'none';
        isSlow = false;
      }
    } else {
      // Desktop without downlink, use effectiveType or type
      if (effectiveType === '4g' || type === 'wifi' || type === 'ethernet') {
        slowLevel = 'none';
        isSlow = false;
      } else {
        slowLevel = 'moderate';
        isSlow = true;
      }
    }
  } else if (downlink !== undefined) {
    // Primary classification: use downlink speed (most reliable indicator for mobile)
    if (downlink < 5) {
      slowLevel = 'very';
      isSlow = true;
    } else if (downlink < 6) {
      slowLevel = 'moderate';
      isSlow = true;
    } else if (downlink < 8) {
      slowLevel = 'slight';
      isSlow = true;
    } else {
      // downlink >= 8 Mbps: good connection
      slowLevel = 'none';
      isSlow = false;
    }
  } else if (effectiveType) {
    // Fallback 1: use effectiveType if downlink is not available
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      slowLevel = 'very';
      isSlow = true;
    } else if (effectiveType === '3g') {
      slowLevel = 'moderate';
      isSlow = true;
    } else if (effectiveType === '4g') {
      // 4g is generally good, but without downlink we can't be sure
      // Assume good connection
      slowLevel = 'none';
      isSlow = false;
    }
  } else if (type) {
    // Fallback 2: use connection type if neither downlink nor effectiveType available
    if (type === 'cellular' && effectiveType !== '4g') {
      // Cellular without 4g indication: assume moderate
      slowLevel = 'moderate';
      isSlow = true;
    } else if (type === 'wifi' || type === 'ethernet') {
      // WiFi and ethernet are generally good
      slowLevel = 'none';
      isSlow = false;
    }
    // Other types (bluetooth, wimax, etc.) default to 'none' (good)
  }

  return {
    isSlow,
    slowLevel,
    effectiveType: effectiveType || null,
    downlink: downlink || null,
    rtt: rtt || null,
    type: type || null,
    saveData,
  };
}
