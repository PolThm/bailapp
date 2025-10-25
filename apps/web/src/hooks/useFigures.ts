import { createContext, useContext } from 'react';
import type { Figure, DanceStyle } from '@/types';

export interface FiguresContextType {
  figures: Figure[];
  shorts: Figure[];
  getFigure: (id: string) => Figure | undefined;
  getFiguresByCategory: (category: DanceStyle) => Figure[];
  addFigure: (figure: Figure) => void;
  updateFigure: (id: string, updates: Partial<Figure>) => void;
}

export const FiguresContext = createContext<FiguresContextType | undefined>(undefined);

export function useFigures() {
  const context = useContext(FiguresContext);
  if (context === undefined) {
    throw new Error('useFigures must be used within a FiguresProvider');
  }
  return context;
}
