import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getUserChoreographies,
  createChoreography,
  updateChoreography as updateChoreographyInFirestore,
  deleteChoreography as deleteChoreographyFromFirestore,
} from '@/lib/services/choreographyService';
import type { Choreography } from '@/types';
import { createExampleChoreography } from '@/data/mockChoreographies';

interface ChoreographiesContextType {
  choreographies: Choreography[];
  addChoreography: (choreography: Choreography) => Promise<string>;
  updateChoreography: (id: string, updates: Partial<Choreography>) => void;
  deleteChoreography: (id: string) => void;
  getChoreography: (id: string) => Choreography | undefined;
  isLoading: boolean;
}

const ChoreographiesContext = createContext<ChoreographiesContextType | undefined>(
  undefined
);

export function ChoreographiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [choreographies, setChoreographies] = useState<Choreography[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load choreographies from Firestore (only if authenticated)
  useEffect(() => {
    let cancelled = false;

    async function loadChoreographies() {
      setIsLoading(true);
      try {
        if (user && user.uid) {
          // User is authenticated: load from Firestore
          try {
            const loadedChoreographies = await getUserChoreographies(user.uid);
            
            // Ensure all choreographies have movements array
            const migratedChoreographies = loadedChoreographies.map((choreography: Choreography) => ({
              ...choreography,
              movements: choreography.movements || [],
            }));
            
            // Only create example if user has no choreographies
            // This ensures that if user deletes the example, it stays deleted
            if (migratedChoreographies.length === 0) {
              const exampleChoreography = createExampleChoreography();
              // Create example in Firestore
              try {
                const exampleId = await createChoreography(
                  {
                    name: exampleChoreography.name,
                    danceStyle: exampleChoreography.danceStyle,
                    danceSubStyle: exampleChoreography.danceSubStyle,
                    complexity: exampleChoreography.complexity,
                    movements: exampleChoreography.movements,
                  },
                  user.uid
                );
                // Create a new choreography object with the Firestore ID
                const exampleWithFirestoreId: Choreography = {
                  ...exampleChoreography,
                  id: exampleId,
                };
                migratedChoreographies.push(exampleWithFirestoreId);
              } catch (error) {
                console.error('Failed to create example choreography in Firestore:', error);
                // Don't add it locally if Firestore creation fails
              }
            }
            
            if (!cancelled) {
              setChoreographies(migratedChoreographies);
              setIsLoading(false);
            }
          } catch (error: any) {
            console.error('Failed to load choreographies from Firestore:', error);
            if (!cancelled) {
              // On error, set empty array
              setChoreographies([]);
              setIsLoading(false);
            }
          }
        } else {
          // User is not authenticated: no choreographies
          if (!cancelled) {
            setChoreographies([]);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to load choreographies:', error);
        if (!cancelled) {
          setChoreographies([]);
          setIsLoading(false);
        }
      }
    }

    loadChoreographies();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const addChoreography = async (choreography: Choreography): Promise<string> => {
    // Optimistic update: update local state immediately
    setChoreographies((prev) => [...prev, choreography]);

    // Sync to Firestore if authenticated
    if (user && user.uid) {
      try {
        // Always create in Firestore and get the Firestore ID
        const firestoreId = await createChoreography(
          {
            name: choreography.name,
            danceStyle: choreography.danceStyle,
            danceSubStyle: choreography.danceSubStyle,
            complexity: choreography.complexity,
            phrasesCount: choreography.phrasesCount,
            movements: choreography.movements || [],
            lastOpenedAt: choreography.lastOpenedAt,
          },
          user.uid
        );
        // Update the choreography with the Firestore ID
        setChoreographies((prev) =>
          prev.map((c) => (c.id === choreography.id ? { ...c, id: firestoreId } : c))
        );
        return firestoreId;
      } catch (error: any) {
        console.error('Failed to add choreography to Firestore:', error);
        // Only revert if it's a permissions error (user might have been logged out)
        if (error?.code === 'permission-denied') {
          // Revert on error
          setChoreographies((prev) => prev.filter((c) => c.id !== choreography.id));
        }
        throw error;
      }
    }
    // Return the temporary ID if not authenticated
    return choreography.id;
  };

  const updateChoreography = async (id: string, updates: Partial<Choreography>) => {
    // Store the previous state for potential revert
    let previousChoreography: Choreography | undefined;
    
    // Optimistic update: update local state immediately
    setChoreographies((prev) => {
      return prev.map((choreography) => {
        if (choreography.id === id) {
          previousChoreography = choreography;
          // Filter out undefined values to avoid overwriting existing values
          const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value !== undefined)
          ) as Partial<Choreography>;
          return { ...choreography, ...filteredUpdates };
        }
        return choreography;
      });
    });

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      updateChoreographyInFirestore(id, updates, user.uid).catch((error: any) => {
        console.error('Failed to update choreography in Firestore:', error);
        // Only revert if it's a permissions error (user might have been logged out)
        if (error?.code === 'permission-denied' && previousChoreography) {
          // Revert on error
          setChoreographies((prev) =>
            prev.map((c) => (c.id === id ? previousChoreography! : c))
          );
        }
      });
    }
  };

  const deleteChoreography = async (id: string) => {
    // Store the previous state for potential revert
    const previousChoreography = choreographies.find((c) => c.id === id);
    
    // Optimistic update: update local state immediately
    setChoreographies((prev) => prev.filter((choreography) => choreography.id !== id));

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      deleteChoreographyFromFirestore(id).catch((error: any) => {
        console.error('Failed to delete choreography from Firestore:', error);
        // Only revert if it's a permissions error (user might have been logged out)
        if (error?.code === 'permission-denied' && previousChoreography) {
          // Revert on error
          setChoreographies((prev) => [...prev, previousChoreography]);
        }
      });
    }
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
        isLoading,
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

