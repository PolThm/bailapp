import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserFavorites } from '@/lib/services/favoritesService';
import { useAuth } from '@/context/AuthContext';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { getCachedData, setCachedData } from '@/lib/cache';
import {
  getUserFavoritesFromFirestore,
  addToFavoritesInFirestore,
  removeFromFavoritesInFirestore,
  updateFavoriteLastOpenedInFirestore,
  updateFavoriteMasteryLevelInFirestore,
} from '@/lib/services/favoritesService';
import { addToSyncQueue, getSyncQueue } from '@/lib/syncQueue';

interface FavoritesContextType {
  favorites: string[];
  lastOpenedAt: Record<string, string>; // { figureId: ISO string }
  masteryLevels: Record<string, number>; // { figureId: level }
  addToFavorites: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  updateLastOpened: (id: string, lastOpenedAt: string) => void;
  updateMasteryLevel: (id: string, level: number) => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { shouldUseCache } = useOfflineStatus();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastOpenedAt, setLastOpenedAt] = useState<Record<string, string>>({});
  const [masteryLevels, setMasteryLevels] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites and lastOpenedAt from Firestore (only if authenticated)
  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      setIsLoading(true);
      try {
        if (user && user.uid) {
          const cacheKey = `favorites_${user.uid}`;

          // Check if there are pending sync operations
          // If yes, don't reload from Firestore yet to avoid overwriting local changes
          const queue = await getSyncQueue();
          const hasPendingFavoriteOps = queue.some(
            (op) =>
              op.type === 'addFavorite' ||
              op.type === 'removeFavorite' ||
              op.type === 'updateFavoriteLastOpened' ||
              op.type === 'updateFavoriteMasteryLevel'
          );

          // If should use cache (offline or slow connection), load directly from cache
          if (shouldUseCache) {
            const cachedData = await getCachedData<UserFavorites>(cacheKey);
            if (cachedData && !cancelled) {
              const figureIds = cachedData.favorites.map((fav) => fav.figureId);
              const lastOpenedAtMap: Record<string, string> = {};
              const masteryLevelsMap: Record<string, number> = {};

              cachedData.favorites.forEach((fav) => {
                if (fav.lastOpenedAt) {
                  lastOpenedAtMap[fav.figureId] = fav.lastOpenedAt;
                }
                if (fav.masteryLevel !== null) {
                  masteryLevelsMap[fav.figureId] = fav.masteryLevel;
                }
              });

              setFavorites(figureIds);
              setLastOpenedAt(lastOpenedAtMap);
              setMasteryLevels(masteryLevelsMap);
              setIsLoading(false);
              return;
            }
            // If no cache available, continue to try Firestore (might work)
          }

          // If we have pending operations and we're coming back online,
          // keep using local state until sync completes
          if (hasPendingFavoriteOps && !shouldUseCache) {
            // Load from cache to ensure we have the latest local state
            const cachedData = await getCachedData<UserFavorites>(cacheKey);
            if (cachedData && !cancelled) {
              const figureIds = cachedData.favorites.map((fav) => fav.figureId);
              const lastOpenedAtMap: Record<string, string> = {};
              const masteryLevelsMap: Record<string, number> = {};

              cachedData.favorites.forEach((fav) => {
                if (fav.lastOpenedAt) {
                  lastOpenedAtMap[fav.figureId] = fav.lastOpenedAt;
                }
                if (fav.masteryLevel !== null) {
                  masteryLevelsMap[fav.figureId] = fav.masteryLevel;
                }
              });

              setFavorites(figureIds);
              setLastOpenedAt(lastOpenedAtMap);
              setMasteryLevels(masteryLevelsMap);
              setIsLoading(false);
              return;
            }
          }

          // Try to load from Firestore first
          try {
            const { favorites: favoritesArray } = await getUserFavoritesFromFirestore(user.uid);
            if (!cancelled) {
              // Transform array to separate structures for backward compatibility
              const figureIds = favoritesArray.map((fav) => fav.figureId);
              const lastOpenedAtMap: Record<string, string> = {};
              const masteryLevelsMap: Record<string, number> = {};

              favoritesArray.forEach((fav) => {
                if (fav.lastOpenedAt) {
                  lastOpenedAtMap[fav.figureId] = fav.lastOpenedAt;
                }
                if (fav.masteryLevel !== null) {
                  masteryLevelsMap[fav.figureId] = fav.masteryLevel;
                }
              });

              setFavorites(figureIds);
              setLastOpenedAt(lastOpenedAtMap);
              setMasteryLevels(masteryLevelsMap);

              // Cache the data for offline use
              await setCachedData(cacheKey, { favorites: favoritesArray });
              setIsLoading(false);
            }
          } catch (error: any) {
            console.error('Failed to load favorites from Firestore:', error);

            // If should use cache or network error, try to load from cache
            if (
              shouldUseCache ||
              error?.code === 'unavailable' ||
              error?.code === 'deadline-exceeded'
            ) {
              const cachedData = await getCachedData<UserFavorites>(cacheKey);
              if (cachedData && !cancelled) {
                const figureIds = cachedData.favorites.map((fav) => fav.figureId);
                const lastOpenedAtMap: Record<string, string> = {};
                const masteryLevelsMap: Record<string, number> = {};

                cachedData.favorites.forEach((fav) => {
                  if (fav.lastOpenedAt) {
                    lastOpenedAtMap[fav.figureId] = fav.lastOpenedAt;
                  }
                  if (fav.masteryLevel !== null) {
                    masteryLevelsMap[fav.figureId] = fav.masteryLevel;
                  }
                });

                setFavorites(figureIds);
                setLastOpenedAt(lastOpenedAtMap);
                setMasteryLevels(masteryLevelsMap);
                setIsLoading(false);
                return;
              }
            }

            // On error and no cache, set empty array
            if (!cancelled) {
              setFavorites([]);
              setLastOpenedAt({});
              setMasteryLevels({});
              setIsLoading(false);
            }
          }
        } else {
          // User is not authenticated: no favorites
          if (!cancelled) {
            setFavorites([]);
            setLastOpenedAt({});
            setMasteryLevels({});
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
        if (!cancelled) {
          setFavorites([]);
          setLastOpenedAt({});
          setMasteryLevels({});
          setIsLoading(false);
        }
      }
    }

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [user, shouldUseCache]);

  // No need to persist to IndexedDB - Firestore is the source of truth

  const addToFavorites = async (id: string) => {
    // Optimistic update: update local state immediately
    let updatedFavorites: string[] = [];
    setFavorites((prev) => {
      if (prev.includes(id)) {
        updatedFavorites = prev;
        return prev;
      }
      updatedFavorites = [...prev, id];
      return updatedFavorites;
    });

    // Set lastOpenedAt to now when adding to favorites
    const now = new Date().toISOString();
    let updatedLastOpenedAt: Record<string, string> = {};
    setLastOpenedAt((prev) => {
      updatedLastOpenedAt = {
        ...prev,
        [id]: now,
      };
      return updatedLastOpenedAt;
    });

    // Update cache immediately with the new state
    if (user && user.uid) {
      const cacheKey = `favorites_${user.uid}`;
      const favoritesArray = updatedFavorites.map((figureId) => ({
        figureId,
        lastOpenedAt: updatedLastOpenedAt[figureId] || null,
        masteryLevel: masteryLevels[figureId] || null,
      }));
      await setCachedData(cacheKey, { favorites: favoritesArray });
    }

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (shouldUseCache) {
        // Queue for sync when back online
        await addToSyncQueue({
          type: 'addFavorite',
          userId: user.uid,
          data: { figureId: id },
        });
      } else {
        addToFavoritesInFirestore(user.uid, id).catch(async (error: any) => {
          console.error('Failed to add to favorites in Firestore:', error);
          // If network error, queue for later
          if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
            await addToSyncQueue({
              type: 'addFavorite',
              userId: user.uid,
              data: { figureId: id },
            });
          } else if (error?.code === 'permission-denied') {
            // Revert on permission error
            setFavorites((prev) => prev.filter((favId) => favId !== id));
            setLastOpenedAt((prev) => {
              const newMap = { ...prev };
              delete newMap[id];
              return newMap;
            });
            // Also revert cache
            if (user && user.uid) {
              const cacheKey = `favorites_${user.uid}`;
              const revertedFavorites = updatedFavorites.filter((favId) => favId !== id);
              const revertedLastOpenedAt = { ...updatedLastOpenedAt };
              delete revertedLastOpenedAt[id];
              const favoritesArray = revertedFavorites.map((figureId) => ({
                figureId,
                lastOpenedAt: revertedLastOpenedAt[figureId] || null,
                masteryLevel: null as number | null,
              }));
              await setCachedData(cacheKey, { favorites: favoritesArray });
            }
          }
        });
      }
    }
  };

  const removeFromFavorites = async (id: string) => {
    // Store previous state for potential revert
    const previousFavorites = favorites;
    const previousLastOpenedAt = lastOpenedAt;
    const previousMasteryLevels = masteryLevels;

    // Optimistic update: update local state immediately
    let updatedFavorites: string[] = [];
    setFavorites((prev) => {
      updatedFavorites = prev.filter((favId) => favId !== id);
      return updatedFavorites;
    });

    // Update cache immediately with the new state
    if (user && user.uid) {
      const cacheKey = `favorites_${user.uid}`;
      const favoritesArray = updatedFavorites.map((figureId) => ({
        figureId,
        lastOpenedAt: previousLastOpenedAt[figureId] || null,
        masteryLevel: previousMasteryLevels[figureId] || null,
      }));
      await setCachedData(cacheKey, { favorites: favoritesArray });
    }

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (shouldUseCache) {
        // Queue for sync when back online
        await addToSyncQueue({
          type: 'removeFavorite',
          userId: user.uid,
          data: { figureId: id },
        });
      } else {
        removeFromFavoritesInFirestore(user.uid, id).catch(async (error: any) => {
          console.error('Failed to remove from favorites in Firestore:', error);
          // If network error, queue for later
          if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
            await addToSyncQueue({
              type: 'removeFavorite',
              userId: user.uid,
              data: { figureId: id },
            });
          } else if (error?.code === 'permission-denied') {
            // Revert on permission error
            setFavorites(previousFavorites);
            setLastOpenedAt(previousLastOpenedAt);
            setMasteryLevels(previousMasteryLevels);
            // Also revert cache
            if (user && user.uid) {
              const cacheKey = `favorites_${user.uid}`;
              const favoritesArray = previousFavorites.map((figureId) => ({
                figureId,
                lastOpenedAt: previousLastOpenedAt[figureId] || null,
                masteryLevel: previousMasteryLevels[figureId] || null,
              }));
              await setCachedData(cacheKey, { favorites: favoritesArray });
            }
          }
        });
      }
    }
  };

  const isFavorite = (id: string) => {
    return favorites.includes(id);
  };

  const toggleFavorite = (id: string) => {
    if (isFavorite(id)) {
      removeFromFavorites(id);
    } else {
      addToFavorites(id);
    }
  };

  const updateLastOpened = async (id: string, lastOpenedAtValue: string) => {
    // Only update if the figure is in favorites
    if (!isFavorite(id)) return;

    // Optimistic update: update local state immediately
    let updatedLastOpenedAt: Record<string, string> = {};
    setLastOpenedAt((prev) => {
      updatedLastOpenedAt = {
        ...prev,
        [id]: lastOpenedAtValue,
      };
      return updatedLastOpenedAt;
    });

    // Update cache immediately with the new state
    if (user && user.uid) {
      const cacheKey = `favorites_${user.uid}`;
      const favoritesArray = favorites.map((figureId) => ({
        figureId,
        lastOpenedAt: updatedLastOpenedAt[figureId] || null,
        masteryLevel: masteryLevels[figureId] || null,
      }));
      await setCachedData(cacheKey, { favorites: favoritesArray });
    }

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (shouldUseCache) {
        // Queue for sync when back online
        await addToSyncQueue({
          type: 'updateFavoriteLastOpened',
          userId: user.uid,
          data: { figureId: id, lastOpenedAt: lastOpenedAtValue },
        });
      } else {
        updateFavoriteLastOpenedInFirestore(user.uid, id, lastOpenedAtValue).catch(
          async (error: any) => {
            console.error('Failed to update favorite lastOpenedAt in Firestore:', error);
            // If network error, queue for later
            if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
              await addToSyncQueue({
                type: 'updateFavoriteLastOpened',
                userId: user.uid,
                data: { figureId: id, lastOpenedAt: lastOpenedAtValue },
              });
            } else if (error?.code === 'permission-denied') {
              // Revert on permission error
              setLastOpenedAt((prev) => {
                const newMap = { ...prev };
                delete newMap[id];
                return newMap;
              });
              // Also revert cache
              if (user && user.uid) {
                const cacheKey = `favorites_${user.uid}`;
                const revertedLastOpenedAt = { ...updatedLastOpenedAt };
                delete revertedLastOpenedAt[id];
                const favoritesArray = favorites.map((figureId) => ({
                  figureId,
                  lastOpenedAt: revertedLastOpenedAt[figureId] || null,
                  masteryLevel: masteryLevels[figureId] || null,
                }));
                await setCachedData(cacheKey, { favorites: favoritesArray });
              }
            }
          }
        );
      }
    }
  };

  const updateMasteryLevel = async (id: string, level: number) => {
    // Only update if the figure is in favorites
    if (!isFavorite(id)) return;

    // Optimistic update: update local state immediately
    let updatedMasteryLevels: Record<string, number> = {};
    setMasteryLevels((prev) => {
      updatedMasteryLevels = {
        ...prev,
        [id]: level,
      };
      return updatedMasteryLevels;
    });

    // Update cache immediately with the new state
    if (user && user.uid) {
      const cacheKey = `favorites_${user.uid}`;
      const favoritesArray = favorites.map((figureId) => ({
        figureId,
        lastOpenedAt: lastOpenedAt[figureId] || null,
        masteryLevel: updatedMasteryLevels[figureId] || null,
      }));
      await setCachedData(cacheKey, { favorites: favoritesArray });
    }

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (shouldUseCache) {
        // Queue for sync when back online
        await addToSyncQueue({
          type: 'updateFavoriteMasteryLevel',
          userId: user.uid,
          data: { figureId: id, level },
        });
      } else {
        updateFavoriteMasteryLevelInFirestore(user.uid, id, level).catch(async (error: any) => {
          console.error('Failed to update favorite mastery level in Firestore:', error);
          // If network error, queue for later
          if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
            await addToSyncQueue({
              type: 'updateFavoriteMasteryLevel',
              userId: user.uid,
              data: { figureId: id, level },
            });
          } else if (error?.code === 'permission-denied') {
            // Revert on permission error
            setMasteryLevels((prev) => {
              const newMap = { ...prev };
              delete newMap[id];
              return newMap;
            });
            // Also revert cache
            if (user && user.uid) {
              const cacheKey = `favorites_${user.uid}`;
              const revertedMasteryLevels = { ...updatedMasteryLevels };
              delete revertedMasteryLevels[id];
              const favoritesArray = favorites.map((figureId) => ({
                figureId,
                lastOpenedAt: lastOpenedAt[figureId] || null,
                masteryLevel: revertedMasteryLevels[figureId] || null,
              }));
              await setCachedData(cacheKey, { favorites: favoritesArray });
            }
          }
        });
      }
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        lastOpenedAt,
        masteryLevels,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
        updateLastOpened,
        updateMasteryLevel,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
