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

// Network quality thresholds (in Mbps)
const NETWORK_THRESHOLDS = {
  VERY_SLOW: 5,
  MODERATE: 6,
  SLIGHT: 8,
  RTT_LOW: 200,
  RTT_VERY_HIGH: 1000,
  DESKTOP_MIN: 1,
} as const;

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

/**
 * Detect if the user is on a desktop device
 */
function isDesktopDevice(): boolean {
  const isMobile =
    /iPad|iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && navigator.maxTouchPoints > 0);
  return !isMobile;
}

/**
 * Classify connection speed based on downlink value
 */
function classifyDownlinkSpeed(downlink: number): SlowConnectionLevel {
  if (downlink < NETWORK_THRESHOLDS.VERY_SLOW) return 'very';
  if (downlink < NETWORK_THRESHOLDS.MODERATE) return 'moderate';
  if (downlink < NETWORK_THRESHOLDS.SLIGHT) return 'slight';
  return 'none';
}

/**
 * Calculate network quality for desktop devices
 * Desktop connections are more permissive as API values can be unreliable
 */
function calculateDesktopQuality(connection: NetworkConnection): SlowConnectionLevel {
  const { effectiveType, downlink, rtt, type } = connection;

  const isWifiOrEthernet = type === 'wifi' || type === 'ethernet' || type === undefined;
  const hasGoodEffectiveType = effectiveType === '4g';
  const hasLowRTT = rtt !== undefined && rtt < NETWORK_THRESHOLDS.RTT_LOW;

  // WiFi/Ethernet with good indicators
  if (isWifiOrEthernet && (hasGoodEffectiveType || hasLowRTT)) {
    if (downlink !== undefined && downlink < NETWORK_THRESHOLDS.DESKTOP_MIN) {
      return 'very';
    }
    if (rtt !== undefined && rtt > NETWORK_THRESHOLDS.RTT_VERY_HIGH) {
      return 'moderate';
    }
    return 'none';
  }

  // Use downlink if available
  if (downlink !== undefined) {
    return classifyDownlinkSpeed(downlink);
  }

  // Fallback to type/effectiveType
  if (effectiveType === '4g' || type === 'wifi' || type === 'ethernet') {
    return 'none';
  }

  return 'moderate';
}

/**
 * Calculate network quality for mobile devices
 */
function calculateMobileQuality(connection: NetworkConnection): SlowConnectionLevel {
  const { effectiveType, downlink, type } = connection;

  // Primary: use downlink speed (most reliable for mobile)
  if (downlink !== undefined) {
    return classifyDownlinkSpeed(downlink);
  }

  // Fallback 1: effectiveType
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'very';
  }
  if (effectiveType === '3g') {
    return 'moderate';
  }
  if (effectiveType === '4g') {
    return 'none';
  }

  // Fallback 2: connection type
  if (type === 'cellular' && effectiveType !== '4g') {
    return 'moderate';
  }
  if (type === 'wifi' || type === 'ethernet') {
    return 'none';
  }

  return 'none';
}

function calculateNetworkQuality(connection: NetworkConnection | null): NetworkQuality {
  // Early return for no connection
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

  const { effectiveType, downlink, rtt, type, saveData = false } = connection;

  // Calculate slow level based on device type and connection properties
  let slowLevel: SlowConnectionLevel;

  // Override: saveData enabled = very slow connection
  if (saveData) {
    slowLevel = 'very';
  } else if (isDesktopDevice()) {
    slowLevel = calculateDesktopQuality(connection);
  } else {
    slowLevel = calculateMobileQuality(connection);
  }

  return {
    isSlow: slowLevel !== 'none',
    slowLevel,
    effectiveType: effectiveType || null,
    downlink: downlink || null,
    rtt: rtt || null,
    type: type || null,
    saveData,
  };
}
