import { useIndexedDB } from './useIndexedDB';
import { getStorageKey, StorageKey } from '@/lib/storageKeys';

export function useMasteryLevel(figureId: string | undefined) {
  const [masteryLevels, setMasteryLevels] = useIndexedDB<Record<string, number>>(
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

