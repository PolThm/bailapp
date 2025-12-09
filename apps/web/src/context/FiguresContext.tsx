import { useState, useEffect, ReactNode } from 'react';
import type { Figure, DanceStyle } from '@/types';
import { useFavorites } from '@/context/FavoritesContext';
import { classicVideoList } from '@/data/classicVideoList';
import { shortVideoList } from '@/data/shortVideoList';
import { FiguresContext } from '@/hooks/useFigures';

export function FiguresProvider({ children }: { children: ReactNode }) {
  const { lastOpenedAt } = useFavorites();
  const [figures, setFigures] = useState<Figure[]>(classicVideoList);
  const [shorts, setShorts] = useState<Figure[]>(shortVideoList);

  // Merge mockFigures with lastOpenedAt from favorites
  useEffect(() => {
    setFigures(
      classicVideoList.map((figure) => ({
        ...figure,
        lastOpenedAt: lastOpenedAt[figure.id] || figure.lastOpenedAt,
      }))
    );
    // Also merge shorts with lastOpenedAt
    setShorts(
      shortVideoList.map((short) => ({
        ...short,
        lastOpenedAt: lastOpenedAt[short.id] || short.lastOpenedAt,
      }))
    );
  }, [lastOpenedAt]);

  const getFigure = (id: string) => {
    // Check in both figures and shorts
    return figures.find((figure) => figure.id === id) || shorts.find((short) => short.id === id);
  };

  const getFiguresByCategory = (category: DanceStyle) => {
    return figures.filter((figure) => figure.danceStyle === category);
  };

  const addFigure = (figure: Figure) => {
    setFigures((prev) => [...prev, figure]);
  };

  const updateFigure = (id: string, updates: Partial<Figure>) => {
    setFigures((prev) =>
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

  return (
    <FiguresContext.Provider
      value={{
        figures,
        shorts,
        getFigure,
        getFiguresByCategory,
        addFigure,
        updateFigure,
      }}
    >
      {children}
    </FiguresContext.Provider>
  );
}
