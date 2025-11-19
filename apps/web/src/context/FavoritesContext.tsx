import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getUserFavoritesFromFirestore,
  addToFavoritesInFirestore,
  removeFromFavoritesInFirestore,
} from '@/lib/services/favoritesService';

interface FavoritesContextType {
  favorites: string[];
  addToFavorites: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from Firestore (only if authenticated)
  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      setIsLoading(true);
      try {
        if (user && user.uid) {
          // User is authenticated: load from Firestore
          try {
            const firestoreFavorites = await getUserFavoritesFromFirestore(user.uid);
            if (!cancelled) {
              setFavorites(firestoreFavorites);
              setIsLoading(false);
            }
          } catch (error: any) {
            console.error('Failed to load favorites from Firestore:', error);
            if (!cancelled) {
              // On error, set empty array
              setFavorites([]);
              setIsLoading(false);
            }
          }
        } else {
          // User is not authenticated: no favorites
          if (!cancelled) {
            setFavorites([]);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
        if (!cancelled) {
          setFavorites([]);
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

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      addToFavoritesInFirestore(user.uid, id).catch((error: any) => {
        console.error('Failed to add to favorites in Firestore:', error);
        // Only revert if it's a permissions error (user might have been logged out)
        if (error?.code === 'permission-denied') {
          // Revert on error
          setFavorites((prev) => prev.filter((favId) => favId !== id));
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

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
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

