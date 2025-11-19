import { useFavorites } from '@/context/FavoritesContext';

export function useMasteryLevel(figureId: string | undefined) {
  const { masteryLevels, updateMasteryLevel, isLoading } = useFavorites();

  const masteryLevel = figureId ? masteryLevels[figureId] : undefined;

  const setMasteryLevel = (level: number) => {
    if (!figureId) return;
    updateMasteryLevel(figureId, level);
  };

  const hasMasteryLevel = masteryLevel !== undefined;

  return {
    masteryLevel,
    setMasteryLevel,
    hasMasteryLevel,
    isLoading,
  };
}

