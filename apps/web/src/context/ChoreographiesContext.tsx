import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStorageKey, StorageKey } from '@/lib/storageKeys';
import { getItem, setItem } from '@/lib/indexedDB';
import type { Choreography } from '@/types';
import { createExampleChoreography, EXAMPLE_CHOREOGRAPHY_ID } from '@/data/mockChoreographies';

interface ChoreographiesContextType {
  choreographies: Choreography[];
  addChoreography: (choreography: Choreography) => void;
  updateChoreography: (id: string, updates: Partial<Choreography>) => void;
  deleteChoreography: (id: string) => void;
  getChoreography: (id: string) => Choreography | undefined;
}

const ChoreographiesContext = createContext<ChoreographiesContextType | undefined>(
  undefined
);

const STORAGE_KEY = getStorageKey(StorageKey.CHOREOGRAPHIES);
const EXAMPLE_SHOWN_KEY = getStorageKey(StorageKey.EXAMPLE_CHOREOGRAPHY_SHOWN);

export function ChoreographiesProvider({ children }: { children: ReactNode }) {
  const [choreographies, setChoreographies] = useState<Choreography[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;

    async function loadChoreographies() {
      try {
        const stored = await getItem(STORAGE_KEY);
        const exampleShown = await getItem(EXAMPLE_SHOWN_KEY);
        if (!cancelled) {
          const parsedChoreographies = stored ? JSON.parse(stored) : [];
          // Ensure all choreographies have movements array
          const migratedChoreographies = parsedChoreographies.map((choreography: Choreography) => ({
            ...choreography,
            movements: choreography.movements || [],
          }));
          
          // Check if example choreography already exists in the list
          const hasExample = migratedChoreographies.some(
            (choreography: Choreography) => choreography.id === EXAMPLE_CHOREOGRAPHY_ID
          );
          
          // Only create example if:
          // 1. No choreographies exist AND
          // 2. Example hasn't been shown before (first visit) AND
          // 3. Example doesn't already exist in the list
          // This ensures that if user deletes the example, it stays deleted
          if (migratedChoreographies.length === 0 && !exampleShown && !hasExample) {
            const exampleChoreography = createExampleChoreography();
            migratedChoreographies.push(exampleChoreography);
            // Mark example as shown so it won't be recreated if deleted
            await setItem(EXAMPLE_SHOWN_KEY, 'true');
          }
          
          setChoreographies(migratedChoreographies);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load choreographies:', error);
        if (!cancelled) {
          // On error, check if example should be shown
          try {
            const exampleShown = await getItem(EXAMPLE_SHOWN_KEY);
            if (!exampleShown) {
              const exampleChoreography = createExampleChoreography();
              setChoreographies([exampleChoreography]);
              await setItem(EXAMPLE_SHOWN_KEY, 'true');
            } else {
              setChoreographies([]);
            }
          } catch {
            setChoreographies([]);
          }
          setIsLoaded(true);
        }
      }
    }

    loadChoreographies();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to IndexedDB whenever choreographies change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      setItem(STORAGE_KEY, JSON.stringify(choreographies)).catch((error) => {
        console.error('Failed to save choreographies:', error);
      });
    }
  }, [choreographies, isLoaded]);

  const addChoreography = (choreography: Choreography) => {
    setChoreographies((prev) => [...prev, choreography]);
  };

  const updateChoreography = (id: string, updates: Partial<Choreography>) => {
    setChoreographies((prev) =>
      prev.map((choreography) => {
        if (choreography.id === id) {
          // Filter out undefined values to avoid overwriting existing values
          const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value !== undefined)
          ) as Partial<Choreography>;
          return { ...choreography, ...filteredUpdates };
        }
        return choreography;
      })
    );
  };

  const deleteChoreography = (id: string) => {
    setChoreographies((prev) => prev.filter((choreography) => choreography.id !== id));
  };

  const getChoreography = (id: string) => {
    return choreographies.find((choreography) => choreography.id === id);
  };

  return (
    <ChoreographiesContext.Provider
      value={{
        choreographies,
        addChoreography,
        updateChoreography,
        deleteChoreography,
        getChoreography,
      }}
    >
      {children}
    </ChoreographiesContext.Provider>
  );
}

export function useChoreographies() {
  const context = useContext(ChoreographiesContext);
  if (context === undefined) {
    throw new Error('useChoreographies must be used within a ChoreographiesProvider');
  }
  return context;
}

