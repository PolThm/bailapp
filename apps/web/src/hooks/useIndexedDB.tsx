import { useState, useEffect } from 'react';
import { getItem, setItem } from '@/lib/indexedDB';

export function useIndexedDB<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true);
      return;
    }

    let cancelled = false;

    async function loadValue() {
      try {
        const item = await getItem(key);
        if (!cancelled) {
          const parsedValue = item ? JSON.parse(item) : initialValue;
          setStoredValue(parsedValue);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error(`Error loading ${key} from IndexedDB:`, error);
        if (!cancelled) {
          setStoredValue(initialValue);
          setIsLoaded(true);
        }
      }
    }

    loadValue();

    return () => {
      cancelled = true;
    };
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to IndexedDB.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state immediately for responsive UI
      setStoredValue(valueToStore);
      // Save to IndexedDB asynchronously
      if (typeof window !== 'undefined' && isLoaded) {
        setItem(key, JSON.stringify(valueToStore)).catch((error) => {
          console.error(`Error saving ${key} to IndexedDB:`, error);
        });
      }
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
    }
  };

  return [storedValue, setValue];
}

