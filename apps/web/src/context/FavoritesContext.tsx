import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getUserFavoritesFromFirestore,
  addToFavoritesInFirestore,
  removeFromFavoritesInFirestore,
  updateFavoriteLastOpenedInFirestore,
  updateFavoriteMasteryLevelInFirestore,
} from '@/lib/services/favoritesService';
import { getCachedData, setCachedData } from '@/lib/cache';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { addToSyncQueue } from '@/lib/syncQueue';
import type { UserFavorites } from '@/lib/services/favoritesService';

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

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isOffline } = useOfflineStatus();
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
            
            // If offline or network error, try to load from cache
            if (isOffline || error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
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
  }, [user, isOffline]);

  // No need to persist to IndexedDB - Firestore is the source of truth

  const addToFavorites = async (id: string) => {
    // Optimistic update: update local state immediately
    setFavorites((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });

    // Set lastOpenedAt to now when adding to favorites
    const now = new Date().toISOString();
    setLastOpenedAt((prev) => ({
      ...prev,
      [id]: now,
    }));

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (isOffline) {
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
          }
        });
      }
    }
  };

  const removeFromFavorites = async (id: string) => {
    // Optimistic update: update local state immediately
    setFavorites((prev) => prev.filter((favId) => favId !== id));

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (isOffline) {
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
            setFavorites((prev) => {
              if (prev.includes(id)) return prev;
              return [...prev, id];
            });
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
    setLastOpenedAt((prev) => ({
      ...prev,
      [id]: lastOpenedAtValue,
    }));

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (isOffline) {
        // Queue for sync when back online
        await addToSyncQueue({
          type: 'updateFavoriteLastOpened',
          userId: user.uid,
          data: { figureId: id, lastOpenedAt: lastOpenedAtValue },
        });
      } else {
        updateFavoriteLastOpenedInFirestore(user.uid, id, lastOpenedAtValue).catch(async (error: any) => {
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
          }
        });
      }
    }
  };

  const updateMasteryLevel = async (id: string, level: number) => {
    // Only update if the figure is in favorites
    if (!isFavorite(id)) return;

    // Optimistic update: update local state immediately
    setMasteryLevels((prev) => ({
      ...prev,
      [id]: level,
    }));

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      if (isOffline) {
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

