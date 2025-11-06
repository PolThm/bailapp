import { createContext, useContext, useState, ReactNode } from 'react';
import { mockFigures } from '@/data/mockFigures';
import type { Figure, DanceStyle } from '@/types';

interface FiguresContextType {
  figures: Figure[];
  getFigure: (id: string) => Figure | undefined;
  getFiguresByCategory: (category: DanceStyle) => Figure[];
  addFigure: (figure: Figure) => void;
  updateFigure: (id: string, updates: Partial<Figure>) => void;
}

const FiguresContext = createContext<FiguresContextType | undefined>(undefined);

export function FiguresProvider({ children }: { children: ReactNode }) {
  const [figures, setFigures] = useState<Figure[]>(mockFigures);

  const getFigure = (id: string) => {
    return figures.find((figure) => figure.id === id);
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

export function useFigures() {
  const context = useContext(FiguresContext);
  if (context === undefined) {
    throw new Error('useFigures must be used within a FiguresProvider');
  }
  return context;
}

