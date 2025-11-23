import { useEffect } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { getSyncQueue, removeFromSyncQueue, incrementRetryCount } from '@/lib/syncQueue';
import {
  addToFavoritesInFirestore,
  removeFromFavoritesInFirestore,
  updateFavoriteLastOpenedInFirestore,
  updateFavoriteMasteryLevelInFirestore,
} from '@/lib/services/favoritesService';
import {
  createChoreography,
  updateChoreography,
  deleteChoreography,
} from '@/lib/services/choreographyService';
import type { SyncOperation } from '@/lib/syncQueue';

/**
 * Hook to sync pending operations when back online
 */
export function useSyncQueue() {
  const { shouldUseCache } = useOfflineStatus();

  useEffect(() => {
    if (shouldUseCache) return;

    // Sync queue when back online
    const syncQueue = async () => {
      const queue = await getSyncQueue();
      
      for (const operation of queue) {
        try {
          await executeOperation(operation);
          // Remove from queue on success
          await removeFromSyncQueue(operation.id);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          // Increment retry count
          await incrementRetryCount(operation.id);
        }
      }
    };

    // Small delay to ensure network is stable
    const timeout = setTimeout(syncQueue, 1000);
    return () => clearTimeout(timeout);
  }, [shouldUseCache]);
}

async function executeOperation(operation: SyncOperation): Promise<void> {
  switch (operation.type) {
    case 'addFavorite':
      await addToFavoritesInFirestore(operation.userId, operation.data.figureId);
      break;
    case 'removeFavorite':
      await removeFromFavoritesInFirestore(operation.userId, operation.data.figureId);
      break;
    case 'updateFavoriteLastOpened':
      await updateFavoriteLastOpenedInFirestore(
        operation.userId,
        operation.data.figureId,
        operation.data.lastOpenedAt
      );
      break;
    case 'updateFavoriteMasteryLevel':
      await updateFavoriteMasteryLevelInFirestore(
        operation.userId,
        operation.data.figureId,
        operation.data.level
      );
      break;
    case 'createChoreography':
      await createChoreography(operation.data.choreography, operation.userId);
      break;
    case 'updateChoreography':
      await updateChoreography(
        operation.data.choreographyId,
        operation.data.updates,
        operation.userId
      );
      break;
    case 'deleteChoreography':
      await deleteChoreography(operation.data.choreographyId, operation.userId);
      break;
    case 'toggleChoreographyPublic':
      await updateChoreography(
        operation.data.choreographyId,
        { isPublic: operation.data.isPublic },
        operation.userId
      );
      break;
    default:
      console.warn(`Unknown operation type: ${(operation as any).type}`);
  }
}

