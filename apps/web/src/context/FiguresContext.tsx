import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { Figure, DanceStyle } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { classicVideoList } from '@/data/classicVideoList';
import { shortVideoList } from '@/data/shortVideoList';
import { FiguresContext } from '@/hooks/useFigures';
import {
  getPublicFiguresFromFirestore,
  getUserFiguresFromFirestore,
} from '@/lib/services/figureService';
import { getFigureVideoFormat } from '@/utils/figureVideo';

export function FiguresProvider({ children }: { children: ReactNode }) {
  const { lastOpenedAt } = useFavorites();
  const { user } = useAuth();
  // Figures held in Firestore: the signed-in user's own (any visibility) plus
  // everything moderation has promoted to the public catalogue.
  const [remoteFigures, setRemoteFigures] = useState<Figure[]>([]);
  const [isLoadingUserFigures, setIsLoadingUserFigures] = useState(false);

  const loadRemoteFigures = useCallback(async () => {
    setIsLoadingUserFigures(true);
    try {
      // Two queries rather than one: the security rule inspects
      // resource.data, so each query has to be constrained to match it.
      const [publicFigures, ownFigures] = await Promise.all([
        getPublicFiguresFromFirestore().catch(() => [] as Figure[]),
        user ? getUserFiguresFromFirestore(user.uid).catch(() => [] as Figure[]) : [],
      ]);

      // A user's own public figure comes back from both queries.
      const byId = new Map<string, Figure>();
      for (const figure of [...publicFigures, ...ownFigures]) {
        byId.set(figure.id, figure);
      }
      setRemoteFigures([...byId.values()]);
    } finally {
      setIsLoadingUserFigures(false);
    }
  }, [user]);

  useEffect(() => {
    void loadRemoteFigures();
  }, [loadRemoteFigures]);

  const withLastOpened = useCallback(
    (items: Figure[]) =>
      items.map((item) => ({
        ...item,
        lastOpenedAt: lastOpenedAt[item.id] || item.lastOpenedAt,
      })),
    [lastOpenedAt]
  );

  const figures = useMemo(
    () =>
      withLastOpened([
        ...classicVideoList,
        ...remoteFigures.filter((figure) => getFigureVideoFormat(figure) === 'classic'),
      ]),
    [remoteFigures, withLastOpened]
  );

  const shorts = useMemo(
    () =>
      withLastOpened([
        ...shortVideoList,
        ...remoteFigures.filter((figure) => getFigureVideoFormat(figure) === 'short'),
      ]),
    [remoteFigures, withLastOpened]
  );

  const userFigures = useMemo(
    () => (user ? remoteFigures.filter((figure) => figure.ownerId === user.uid) : ([] as Figure[])),
    [remoteFigures, user]
  );

  const getFigure = (id: string) => {
    // Check in both figures and shorts
    return figures.find((figure) => figure.id === id) || shorts.find((short) => short.id === id);
  };

  const getFiguresByCategory = (category: DanceStyle) => {
    return figures.filter((figure) => figure.danceStyle === category);
  };

  // Local-only insert, so a freshly created figure shows up without waiting
  // for a refetch. Persistence is the caller's job.
  const addFigure = (figure: Figure) => {
    setRemoteFigures((prev) => [figure, ...prev.filter((item) => item.id !== figure.id)]);
  };

  const updateFigure = (id: string, updates: Partial<Figure>) => {
    setRemoteFigures((prev) =>
      prev.map((figure) => {
        if (figure.id === id) {
          // Filter out undefined values to avoid overwriting existing values
          const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value !== undefined)
          ) as Partial<Figure>;
          return { ...figure, ...filteredUpdates };
        }
        return figure;
      })
    );
  };

  const removeFigure = (id: string) => {
    setRemoteFigures((prev) => prev.filter((figure) => figure.id !== id));
  };

  return (
    <FiguresContext.Provider
      value={{
        figures,
        shorts,
        userFigures,
        isLoadingUserFigures,
        getFigure,
        getFiguresByCategory,
        addFigure,
        updateFigure,
        removeFigure,
        refreshFigures: loadRemoteFigures,
      }}
    >
      {children}
    </FiguresContext.Provider>
  );
}
