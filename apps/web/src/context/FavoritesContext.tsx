import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getUserFavoritesFromFirestore,
  addToFavoritesInFirestore,
  removeFromFavoritesInFirestore,
  updateFavoriteLastOpenedInFirestore,
  updateFavoriteMasteryLevelInFirestore,
} from '@/lib/services/favoritesService';

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
          // User is authenticated: load from Firestore
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
              setIsLoading(false);
            }
          } catch (error: any) {
            console.error('Failed to load favorites from Firestore:', error);
            if (!cancelled) {
              // On error, set empty array
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
  }, [user]);

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
      addToFavoritesInFirestore(user.uid, id).catch((error: any) => {
        console.error('Failed to add to favorites in Firestore:', error);
        // Only revert if it's a permissions error (user might have been logged out)
        if (error?.code === 'permission-denied') {
          // Revert on error
          setFavorites((prev) => prev.filter((favId) => favId !== id));
          setLastOpenedAt((prev) => {
            const newMap = { ...prev };
            delete newMap[id];
            return newMap;
          });
        }
      });
    }
  };

  const removeFromFavorites = async (id: string) => {
    // Optimistic update: update local state immediately
    setFavorites((prev) => prev.filter((favId) => favId !== id));

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      removeFromFavoritesInFirestore(user.uid, id).catch((error: any) => {
        console.error('Failed to remove from favorites in Firestore:', error);
        // Only revert if it's a permissions error (user might have been logged out)
        if (error?.code === 'permission-denied') {
          // Revert on error
          setFavorites((prev) => {
            if (prev.includes(id)) return prev;
            return [...prev, id];
          });
        }
      });
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
      updateFavoriteLastOpenedInFirestore(user.uid, id, lastOpenedAtValue).catch((error: any) => {
        console.error('Failed to update favorite lastOpenedAt in Firestore:', error);
        // Only revert if it's a permissions error (user might have been logged out)
        if (error?.code === 'permission-denied') {
          // Revert on error
          setLastOpenedAt((prev) => {
            const newMap = { ...prev };
            delete newMap[id];
            return newMap;
          });
        }
      });
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
      updateFavoriteMasteryLevelInFirestore(user.uid, id, level).catch((error: any) => {
        console.error('Failed to update favorite mastery level in Firestore:', error);
        // Only revert if it's a permissions error (user might have been logged out)
        if (error?.code === 'permission-denied') {
          // Revert on error
          setMasteryLevels((prev) => {
            const newMap = { ...prev };
            delete newMap[id];
            return newMap;
          });
        }
      });
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

