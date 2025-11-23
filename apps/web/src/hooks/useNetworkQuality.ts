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
    
    console.log('[useNetworkQuality] Initial connection check', {
      connectionAvailable: !!connection,
      connection: connection ? {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        type: connection.type,
        saveData: connection.saveData,
      } : null,
    });
    
    if (!connection) {
      // API not available, assume good connection
      console.log('[useNetworkQuality] Connection API not available - assuming good connection');
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
    console.log('[useNetworkQuality] Initial network quality calculated', initialQuality);
    setNetworkQuality(initialQuality);

    // Listen for connection changes
    const handleConnectionChange = () => {
      console.log('[useNetworkQuality] Connection change detected');
      const updatedConnection = getConnection();
      if (updatedConnection) {
        const updatedQuality = calculateNetworkQuality(updatedConnection);
        console.log('[useNetworkQuality] Updated network quality', {
          connection: {
            effectiveType: updatedConnection.effectiveType,
            downlink: updatedConnection.downlink,
            rtt: updatedConnection.rtt,
            type: updatedConnection.type,
            saveData: updatedConnection.saveData,
          },
          quality: updatedQuality,
        });
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

function getConnection(): (NetworkConnection & { addEventListener: (event: string, handler: () => void) => void; removeEventListener: (event: string, handler: () => void) => void }) | null {
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
    console.log('[useNetworkQuality] No connection provided - returning default');
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

  // Determine connection slow level
  // Priority: downlink > effectiveType > type
  let slowLevel: SlowConnectionLevel = 'none';
  let isSlow = false;
  let slowReason = '';

  // Override: if saveData is enabled, consider it very slow
  if (saveData) {
    slowLevel = 'very';
    isSlow = true;
    slowReason = 'saveData is enabled';
  } else if (downlink !== undefined) {
    // Primary classification: use downlink speed (most reliable indicator)
    if (downlink < 5) {
      slowLevel = 'very';
      isSlow = true;
      slowReason = `downlink is ${downlink} Mbps (< 5 Mbps)`;
    } else if (downlink < 6) {
      slowLevel = 'moderate';
      isSlow = true;
      slowReason = `downlink is ${downlink} Mbps (< 6 Mbps)`;
    } else if (downlink < 8) {
      slowLevel = 'slight';
      isSlow = true;
      slowReason = `downlink is ${downlink} Mbps (6-8 Mbps)`;
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
      slowReason = `effectiveType is ${effectiveType}`;
    } else if (effectiveType === '3g') {
      slowLevel = 'moderate';
      isSlow = true;
      slowReason = `effectiveType is ${effectiveType}`;
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
      slowReason = `type is ${type} and effectiveType is not 4g`;
    } else if (type === 'wifi' || type === 'ethernet') {
      // WiFi and ethernet are generally good
      slowLevel = 'none';
      isSlow = false;
    }
    // Other types (bluetooth, wimax, etc.) default to 'none' (good)
  }

  const quality = {
    isSlow,
    slowLevel,
    effectiveType: effectiveType || null,
    downlink: downlink || null,
    rtt: rtt || null,
    type: type || null,
    saveData,
  };

  console.log('[useNetworkQuality] Calculated network quality', {
    input: {
      effectiveType,
      downlink,
      rtt,
      type,
      saveData,
    },
    output: quality,
    slowReason: isSlow ? slowReason : 'Connection is good',
  });

  return quality;
}

