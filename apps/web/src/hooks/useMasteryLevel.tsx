import { useLocalStorage } from './useLocalStorage';
import { getStorageKey, StorageKey } from '@/lib/storageKeys';

export function useMasteryLevel(figureId: string | undefined) {
  const [masteryLevels, setMasteryLevels] = useLocalStorage<Record<string, number>>(
    getStorageKey(StorageKey.MASTERY_LEVELS),
    {}
  );

  const masteryLevel = figureId ? masteryLevels[figureId] : undefined;

  const setMasteryLevel = (level: number) => {
    if (!figureId) return;
    setMasteryLevels((prev) => ({
      ...prev,
      [figureId]: level,
    }));
  };

  const hasMasteryLevel = masteryLevel !== undefined;

  return {
    masteryLevel,
    setMasteryLevel,
    hasMasteryLevel,
  };
}

