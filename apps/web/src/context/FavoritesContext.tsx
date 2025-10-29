import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStorageKey, StorageKey } from '@/lib/storageKeys';
import { getItem, setItem } from '@/lib/indexedDB';

interface FavoritesContextType {
  favorites: string[];
  addToFavorites: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

const STORAGE_KEY = getStorageKey(StorageKey.FAVORITES);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      try {
        const stored = await getItem(STORAGE_KEY);
        if (!cancelled) {
          const parsedFavorites = stored ? JSON.parse(stored) : [];
          setFavorites(parsedFavorites);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
        if (!cancelled) {
          setFavorites([]);
          setIsLoaded(true);
        }
      }
    }

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to IndexedDB whenever favorites change
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      setItem(STORAGE_KEY, JSON.stringify(favorites)).catch((error) => {
        console.error('Failed to save favorites:', error);
      });
    }
  }, [favorites, isLoaded]);

  const addToFavorites = (id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const removeFromFavorites = (id: string) => {
    setFavorites((prev) => prev.filter((favId) => favId !== id));
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

