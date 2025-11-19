import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getUserMasteryLevelsFromFirestore,
  setMasteryLevelInFirestore,
} from '@/lib/services/masteryLevelsService';

export function useMasteryLevel(figureId: string | undefined) {
  const { user } = useAuth();
  const [masteryLevels, setMasteryLevels] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load mastery levels from Firestore (only if authenticated)
  useEffect(() => {
    let cancelled = false;

    async function loadMasteryLevels() {
      if (!user || !user.uid) {
        setIsLoading(false);
        return;
      }

      try {
        const levels = await getUserMasteryLevelsFromFirestore(user.uid);
        if (!cancelled) {
          setMasteryLevels(levels);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load mastery levels from Firestore:', error);
        if (!cancelled) {
          setMasteryLevels({});
          setIsLoading(false);
        }
      }
    }

    loadMasteryLevels();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const masteryLevel = figureId ? masteryLevels[figureId] : undefined;

  const setMasteryLevel = async (level: number) => {
    if (!figureId) return;
    
    // Optimistic update: update local state immediately
    setMasteryLevels((prev) => ({
      ...prev,
      [figureId]: level,
    }));

    // Sync to Firestore if authenticated (background operation)
    if (user && user.uid) {
      setMasteryLevelInFirestore(user.uid, figureId, level).catch((error: any) => {
        console.error('Failed to save mastery level to Firestore:', error);
        // Only revert if it's a permissions error (user might have been logged out)
        if (error?.code === 'permission-denied') {
          // Revert on error
          setMasteryLevels((prev) => {
            const newLevels = { ...prev };
            delete newLevels[figureId];
            return newLevels;
          });
        }
      });
    }
  };

  const hasMasteryLevel = masteryLevel !== undefined;

  return {
    masteryLevel,
    setMasteryLevel,
    hasMasteryLevel,
    isLoading,
  };
}

