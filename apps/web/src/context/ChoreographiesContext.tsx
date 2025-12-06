import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Choreography } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { createExampleChoreography } from '@/data/mockChoreographies';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { getCachedData, setCachedData } from '@/lib/cache';
import {
  getUserChoreographies,
  createChoreography,
  updateChoreography as updateChoreographyInFirestore,
  deleteChoreography as deleteChoreographyFromFirestore,
  followChoreography as followChoreographyInFirestore,
  unfollowChoreography as unfollowChoreographyInFirestore,
  updateChoreographySharingMode,
  getFollowedChoreographies,
} from '@/lib/services/choreographyService';
import { addToSyncQueue, getSyncQueue } from '@/lib/syncQueue';
import { isEmpty } from '@/lib/utils';

interface ChoreographiesContextType {
  choreographies: Choreography[];
  followedChoreographies: Choreography[];
  addChoreography: (choreography: Choreography) => Promise<string>;
  updateChoreography: (id: string, updates: Partial<Choreography>, ownerId?: string) => void;
  deleteChoreography: (id: string) => void;
  getChoreography: (id: string) => Choreography | undefined;
  togglePublic: (id: string) => void;
  copyChoreography: (choreography: Choreography) => Promise<string>;
  followChoreography: (choreographyId: string, ownerId: string) => Promise<void>;
  unfollowChoreography: (choreographyId: string, ownerId: string) => Promise<void>;
  updateSharingMode: (
    choreographyId: string,
    sharingMode: 'view-only' | 'collaborative'
  ) => Promise<void>;
  isLoading: boolean;
  reloadChoreographies: () => Promise<void>;
}

const ChoreographiesContext = createContext<ChoreographiesContextType | undefined>(undefined);

export function ChoreographiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { shouldUseCache } = useOfflineStatus();
  const [choreographies, setChoreographies] = useState<Choreography[]>([]);
  const [followedChoreographies, setFollowedChoreographies] = useState<Choreography[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to reload choreographies from Firestore
  const reloadChoreographies = async () => {
    if (!user || !user.uid) return;

    const cacheKey = `choreographies_${user.uid}`;
    try {
      const loadedChoreographies = await getUserChoreographies(user.uid);
      const migratedChoreographies = loadedChoreographies.map((choreography: Choreography) => ({
        ...choreography,
        movements: choreography.movements || [],
      }));

      setChoreographies(migratedChoreographies);
      await setCachedData(cacheKey, migratedChoreographies);

      // Reload followed choreographies
      try {
        const followed = await getFollowedChoreographies(user.uid);
        setFollowedChoreographies(followed);
      } catch (error) {
        console.error('Failed to reload followed choreographies:', error);
        setFollowedChoreographies([]);
      }
    } catch (error: any) {
      console.error('Failed to reload choreographies from Firestore:', error);
      // On error, try to load from cache
      const cachedChoreographies = await getCachedData<Choreography[]>(cacheKey);
      if (cachedChoreographies) {
        setChoreographies(cachedChoreographies);
      }
    }
  };

  // Load choreographies from Firestore (only if authenticated)
  useEffect(() => {
    let cancelled = false;

    async function loadChoreographies() {
      setIsLoading(true);
      try {
        if (user && user.uid) {
          const cacheKey = `choreographies_${user.uid}`;

          // Check if there are pending sync operations
          // If yes, don't reload from Firestore yet to avoid overwriting local changes
          const queue = await getSyncQueue();
          const hasPendingChoreographyOps = queue.some(
            (op) =>
              op.type === 'createChoreography' ||
              op.type === 'updateChoreography' ||
              op.type === 'deleteChoreography' ||
              op.type === 'toggleChoreographyPublic'
          );

          // If should use cache (offline or slow connection), load directly from cache
          if (shouldUseCache) {
            const cachedChoreographies = await getCachedData<Choreography[]>(cacheKey);
            if (cachedChoreographies && !cancelled) {
              setChoreographies(cachedChoreographies);
              setIsLoading(false);
              return;
            }
            // If no cache available, continue to try Firestore (might work)
          }

          // If we have pending operations and we're coming back online,
          // keep using local state until sync completes
          if (hasPendingChoreographyOps && !shouldUseCache) {
            // Load from cache to ensure we have the latest local state
            const cachedChoreographies = await getCachedData<Choreography[]>(cacheKey);
            if (cachedChoreographies && !cancelled) {
              setChoreographies(cachedChoreographies);
              setIsLoading(false);
              return;
            }
          }

          // User is authenticated: load from Firestore
          try {
            const loadedChoreographies = await getUserChoreographies(user.uid);

            // Ensure all choreographies have movements array
            const migratedChoreographies = loadedChoreographies.map(
              (choreography: Choreography) => ({
                ...choreography,
                movements: choreography.movements || [],
              })
            );

            // Only create example if user has no choreographies
            // This ensures that if user deletes the example, it stays deleted
            if (isEmpty(migratedChoreographies)) {
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
              // Cache the data for offline use
              await setCachedData(cacheKey, migratedChoreographies);

              // Load followed choreographies
              try {
                const followed = await getFollowedChoreographies(user.uid);
                if (!cancelled) {
                  setFollowedChoreographies(followed);
                }
              } catch (error) {
                console.error('Failed to load followed choreographies:', error);
                if (!cancelled) {
                  setFollowedChoreographies([]);
                }
              }

              setIsLoading(false);
            }
          } catch (error: any) {
            console.error('Failed to load choreographies from Firestore:', error);

            // If should use cache or network error, try to load from cache
            if (
              shouldUseCache ||
              error?.code === 'unavailable' ||
              error?.code === 'deadline-exceeded'
            ) {
              const cachedChoreographies = await getCachedData<Choreography[]>(cacheKey);
              if (cachedChoreographies && !cancelled) {
                setChoreographies(cachedChoreographies);
                setIsLoading(false);
                return;
              }
            }

            // On error and no cache, set empty array
            if (!cancelled) {
              setChoreographies([]);
              setIsLoading(false);
            }
          }
        } else {
          // User is not authenticated: show example choreography in read-only mode
          if (!cancelled) {
            const exampleChoreography = createExampleChoreography();
            setChoreographies([exampleChoreography]);
            setFollowedChoreographies([]);
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
  }, [user, shouldUseCache]);

  const addChoreography = async (choreography: Choreography): Promise<string> => {
    // Optimistic update: update local state immediately
    let updatedChoreographies: Choreography[] = [];
    setChoreographies((prev) => {
      updatedChoreographies = [...prev, choreography];
      return updatedChoreographies;
    });

    // Update cache immediately with the new state
    if (user && user.uid) {
      const cacheKey = `choreographies_${user.uid}`;
      await setCachedData(cacheKey, updatedChoreographies);
    }

    // Sync to Firestore if authenticated
    if (user && user.uid) {
      if (shouldUseCache) {
        // Queue for sync when back online
        await addToSyncQueue({
          type: 'createChoreography',
          userId: user.uid,
          data: {
            choreography: {
              name: choreography.name,
              danceStyle: choreography.danceStyle,
              danceSubStyle: choreography.danceSubStyle,
              complexity: choreography.complexity,
              phrasesCount: choreography.phrasesCount,
              movements: choreography.movements || [],
              lastOpenedAt: choreography.lastOpenedAt,
            },
          },
        });
        return choreography.id;
      }

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
        // If network error, queue for later
        if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
          await addToSyncQueue({
            type: 'createChoreography',
            userId: user.uid,
            data: {
              choreography: {
                name: choreography.name,
                danceStyle: choreography.danceStyle,
                danceSubStyle: choreography.danceSubStyle,
                complexity: choreography.complexity,
                phrasesCount: choreography.phrasesCount,
                movements: choreography.movements || [],
                lastOpenedAt: choreography.lastOpenedAt,
              },
            },
          });
          return choreography.id;
        }
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

  const updateChoreography = async (
    id: string,
    updates: Partial<Choreography>,
    ownerId?: string
  ) => {
    // Store the previous state for potential revert
    let previousChoreography: Choreography | undefined;
    let updatedChoreographies: Choreography[] = [];

    // Optimistic update: update local state immediately
    setChoreographies((prev) => {
      updatedChoreographies = prev.map((choreography) => {
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
      return updatedChoreographies;
    });

    // Update cache immediately with the new state
    if (user && user.uid) {
      const cacheKey = `choreographies_${user.uid}`;
      await setCachedData(cacheKey, updatedChoreographies);
    }

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (shouldUseCache) {
        // Queue for sync when back online
        await addToSyncQueue({
          type: 'updateChoreography',
          userId: ownerId || user.uid,
          data: { choreographyId: id, updates, ownerId },
        });
      } else {
        updateChoreographyInFirestore(id, updates, user.uid, ownerId).catch(async (error: any) => {
          console.error('Failed to update choreography in Firestore:', error);
          // If network error, queue for later
          if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
            await addToSyncQueue({
              type: 'updateChoreography',
              userId: ownerId || user.uid,
              data: { choreographyId: id, updates, ownerId },
            });
          } else if (error?.code === 'permission-denied' && previousChoreography) {
            // Revert on permission error
            setChoreographies((prev) => prev.map((c) => (c.id === id ? previousChoreography! : c)));
            // Also revert cache
            if (user && user.uid) {
              const cacheKey = `choreographies_${user.uid}`;
              const revertedChoreographies = updatedChoreographies.map((c) =>
                c.id === id ? previousChoreography! : c
              );
              await setCachedData(cacheKey, revertedChoreographies);
            }
          }
        });
      }
    }
  };

  const deleteChoreography = async (id: string) => {
    // Store the previous state for potential revert
    const previousChoreography = choreographies.find((c) => c.id === id);
    let updatedChoreographies: Choreography[] = [];

    // Optimistic update: update local state immediately
    setChoreographies((prev) => {
      updatedChoreographies = prev.filter((choreography) => choreography.id !== id);
      return updatedChoreographies;
    });

    // Update cache immediately with the new state (without deleted choreography)
    if (user && user.uid) {
      const cacheKey = `choreographies_${user.uid}`;
      await setCachedData(cacheKey, updatedChoreographies);
    }

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (shouldUseCache) {
        // Queue for sync when back online
        await addToSyncQueue({
          type: 'deleteChoreography',
          userId: user.uid,
          data: { choreographyId: id },
        });
      } else {
        deleteChoreographyFromFirestore(id, user.uid).catch(async (error: any) => {
          console.error('Failed to delete choreography from Firestore:', error);
          // If network error, queue for later
          if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
            await addToSyncQueue({
              type: 'deleteChoreography',
              userId: user.uid,
              data: { choreographyId: id },
            });
          } else if (error?.code === 'permission-denied' && previousChoreography) {
            // Revert on permission error
            const revertedChoreographies = [...updatedChoreographies, previousChoreography];
            setChoreographies(revertedChoreographies);
            // Also revert cache
            if (user && user.uid) {
              const cacheKey = `choreographies_${user.uid}`;
              await setCachedData(cacheKey, revertedChoreographies);
            }
          }
        });
      }
    }
  };

  const getChoreography = (id: string) => {
    return choreographies.find((choreography) => choreography.id === id);
  };

  const togglePublic = async (id: string) => {
    const choreography = getChoreography(id);
    if (!choreography) return;

    const newIsPublic = !choreography.isPublic;
    let updatedChoreographies: Choreography[] = [];

    // Optimistic update
    setChoreographies((prev) => {
      updatedChoreographies = prev.map((c) => (c.id === id ? { ...c, isPublic: newIsPublic } : c));
      return updatedChoreographies;
    });

    // If making public, also share linked choreographies (view-only)
    if (newIsPublic && choreography.movements) {
      // Find all choreography mentions in movements
      const mentionedChoreographyIds = choreography.movements
        .filter((m) => m.mentionType === 'choreography' && m.mentionId)
        .map((m) => m.mentionId!)
        .filter((mentionId, index, self) => self.indexOf(mentionId) === index); // Remove duplicates

      // Update each mentioned choreography to be public and view-only
      for (const mentionedId of mentionedChoreographyIds) {
        const mentionedChoreography = getChoreography(mentionedId);
        // Only update if it exists, belongs to the same user, and is not already public
        if (mentionedChoreography && !mentionedChoreography.isPublic) {
          setChoreographies((prev) => {
            updatedChoreographies = prev.map((c) =>
              c.id === mentionedId ? { ...c, isPublic: true, sharingMode: 'view-only' } : c
            );
            return updatedChoreographies;
          });

          // Update in Firestore
          if (!shouldUseCache) {
            updateChoreographyInFirestore(
              mentionedId,
              { isPublic: true, sharingMode: 'view-only' },
              user!.uid
            ).catch((error: any) => {
              console.error(`Failed to share linked choreography ${mentionedId}:`, error);
            });
          }
        }
      }
    }

    // Update cache immediately with the new state
    if (user && user.uid) {
      const cacheKey = `choreographies_${user.uid}`;
      await setCachedData(cacheKey, updatedChoreographies);
    }

    // Sync to Firestore
    if (user && user.uid) {
      if (shouldUseCache) {
        // Queue for sync when back online
        await addToSyncQueue({
          type: 'toggleChoreographyPublic',
          userId: user.uid,
          data: { choreographyId: id, isPublic: newIsPublic },
        });
      } else {
        updateChoreographyInFirestore(id, { isPublic: newIsPublic }, user.uid).catch(
          async (error: any) => {
            console.error('Failed to toggle public status in Firestore:', error);
            // If network error, queue for later
            if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
              await addToSyncQueue({
                type: 'toggleChoreographyPublic',
                userId: user.uid,
                data: { choreographyId: id, isPublic: newIsPublic },
              });
            } else {
              // Revert on other errors
              const revertedChoreographies = updatedChoreographies.map((c) =>
                c.id === id ? { ...c, isPublic: !newIsPublic } : c
              );
              setChoreographies(revertedChoreographies);
              // Also revert cache
              if (user && user.uid) {
                const cacheKey = `choreographies_${user.uid}`;
                await setCachedData(cacheKey, revertedChoreographies);
              }
            }
          }
        );
      }
    }
  };

  const copyChoreography = async (choreography: Choreography): Promise<string> => {
    if (!user || !user.uid) {
      throw new Error('User must be authenticated to copy a choreography');
    }

    const now = new Date().toISOString();

    // Create a copy of the choreography with a new ID and current user as owner
    const copiedChoreography: Choreography = {
      ...choreography,
      id: crypto.randomUUID(), // New ID for the copy
      ownerId: user.uid, // Set current user as owner
      isPublic: false, // Copy is private by default
      sharingMode: 'view-only', // Default to view-only
      followedBy: [], // New choreography has no followers
      createdAt: now, // New creation date
      lastOpenedAt: now, // Set to now so it appears at the top of the list
    };

    // Add to user's choreographies
    return await addChoreography(copiedChoreography);
  };

  const followChoreography = async (choreographyId: string, ownerId: string): Promise<void> => {
    if (!user || !user.uid) {
      throw new Error('User must be authenticated to follow a choreography');
    }

    try {
      await followChoreographyInFirestore(choreographyId, ownerId, user.uid);
      // Reload choreographies and followed choreographies to reflect the change
      await reloadChoreographies();
    } catch (error) {
      console.error('Failed to follow choreography:', error);
      throw error;
    }
  };

  const unfollowChoreography = async (choreographyId: string, ownerId: string): Promise<void> => {
    if (!user || !user.uid) {
      throw new Error('User must be authenticated to unfollow a choreography');
    }

    try {
      await unfollowChoreographyInFirestore(choreographyId, ownerId, user.uid);
      // Reload choreographies and followed choreographies to reflect the change
      await reloadChoreographies();
    } catch (error) {
      console.error('Failed to unfollow choreography:', error);
      throw error;
    }
  };

  const updateSharingMode = async (
    choreographyId: string,
    sharingMode: 'view-only' | 'collaborative'
  ): Promise<void> => {
    if (!user || !user.uid) {
      throw new Error('User must be authenticated to update sharing mode');
    }

    try {
      await updateChoreographySharingMode(choreographyId, user.uid, sharingMode);
      // Update local state
      updateChoreography(choreographyId, { sharingMode });
    } catch (error) {
      console.error('Failed to update sharing mode:', error);
      throw error;
    }
  };

  return (
    <ChoreographiesContext.Provider
      value={{
        choreographies,
        followedChoreographies,
        addChoreography,
        updateChoreography,
        deleteChoreography,
        getChoreography,
        togglePublic,
        copyChoreography,
        followChoreography,
        unfollowChoreography,
        updateSharingMode,
        isLoading,
        reloadChoreographies,
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
