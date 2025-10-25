import { useState, useEffect, useRef } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { getItem, setItem } from '@/lib/indexedDB';

// Counter to help distribute colors more evenly
let colorGenerationCounter = 0;

/**
 * Generates a random color in HSL format with better distribution
 * Uses wider ranges and better hue distribution to avoid similar colors
 */
export function generateRandomColor(): string {
  // Increment counter for better distribution
  colorGenerationCounter++;

  // Use golden ratio to distribute hues more evenly across the color wheel
  // This helps avoid clustering of similar colors
  const goldenRatio = 0.618033988749895;
  const baseHue = (colorGenerationCounter * goldenRatio * 360) % 360;

  // Add some randomness but keep it distributed
  const hueVariation = (Math.random() - 0.5) * 30; // ±15 degrees variation
  const hue = Math.floor((baseHue + hueVariation + 360) % 360);

  // Wider saturation range: 60-95% for more vibrant and distinct colors
  // Avoid low saturation (grayish colors) for better distinction
  const saturation = 55 + Math.floor(Math.random() * 35);

  // Wider lightness range: 50-70% to avoid very dark or very light colors
  // This ensures good contrast while maintaining visibility
  const lightness = 50 + Math.floor(Math.random() * 20);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Change the color for a movement
 */
export async function changeMovementColor(movementId: string): Promise<string> {
  const newColor = generateRandomColor();
  const storageKey = `movement-color-${movementId}`;
  // Use JSON.stringify to match how useIndexedDB stores values
  await setItem(storageKey, JSON.stringify(newColor));
  return newColor;
}

/**
 * Hook to get or generate a persistent color for a movement
 * Colors are stored in IndexedDB keyed by movement ID
 */
export function useMovementColor(movementId: string, refreshKey?: number): string {
  const storageKey = `movement-color-${movementId}`;
  const [color, setColor] = useIndexedDB<string | null>(storageKey, null);
  const [localColor, setLocalColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasGeneratedRef = useRef(false);

  // Initial load: check IndexedDB directly to avoid race condition
  useEffect(() => {
    let cancelled = false;

    const loadColor = async () => {
      try {
        const item = await getItem(storageKey);
        if (!cancelled) {
          if (item) {
            try {
              const parsedColor = JSON.parse(item);
              setLocalColor(parsedColor);
              setColor(parsedColor);
              hasGeneratedRef.current = true;
            } catch {
              // Legacy format: use directly if it's a valid HSL string
              if (typeof item === 'string' && item.match(/hsl\(/)) {
                setLocalColor(item);
                setColor(item);
                hasGeneratedRef.current = true;
                // Migrate to JSON format
                setItem(storageKey, JSON.stringify(item)).catch(() => {
                  // Ignore migration errors
                });
              } else {
                setIsLoading(false);
              }
            }
          } else {
            // No color exists, we'll generate one
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error(`Error loading color for ${movementId}:`, error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadColor();

    return () => {
      cancelled = true;
    };
  }, [storageKey, movementId, setColor]);

  // Reload color from IndexedDB when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      const reloadColor = async () => {
        try {
          const item = await getItem(storageKey);
          if (item) {
            try {
              const parsedColor = JSON.parse(item);
              setLocalColor(parsedColor);
              setColor(parsedColor);
            } catch {
              // Legacy format
              if (typeof item === 'string' && item.match(/hsl\(/)) {
                setLocalColor(item);
                setColor(item);
              }
            }
          }
        } catch (error) {
          console.error(`Error reloading color for ${movementId}:`, error);
        }
      };
      reloadColor();
    }
  }, [refreshKey, storageKey, movementId, setColor]);

  // Generate color only after we've confirmed IndexedDB doesn't have one
  useEffect(() => {
    // Wait for initial load to complete
    if (isLoading) return;

    // If color is loaded from IndexedDB, use it
    if (color !== null) {
      setLocalColor(color);
      hasGeneratedRef.current = true;
      return;
    }

    // If no color exists and we haven't generated one yet, generate it
    if (color === null && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      const newColor = generateRandomColor();
      setLocalColor(newColor);
      // Save to IndexedDB
      setColor(newColor);
    }
  }, [color, setColor, isLoading]);

  // Return the local color (immediate) or the stored color, or transparent as fallback
  return localColor || color || 'transparent';
}
