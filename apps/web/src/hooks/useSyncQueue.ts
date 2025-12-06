import { useEffect } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import type { SyncOperation } from '@/lib/syncQueue';
import { useAuth } from '@/context/AuthContext';
import { useChoreographies } from '@/context/ChoreographiesContext';
import { setCachedData } from '@/lib/cache';
import {
  createChoreography,
  updateChoreography,
  deleteChoreography,
} from '@/lib/services/choreographyService';
import {
  addToFavoritesInFirestore,
  removeFromFavoritesInFirestore,
  updateFavoriteLastOpenedInFirestore,
  updateFavoriteMasteryLevelInFirestore,
} from '@/lib/services/favoritesService';
import { getSyncQueue, removeFromSyncQueue, incrementRetryCount } from '@/lib/syncQueue';
import { isEmpty } from '@/lib/utils';

interface MergedSyncOperation extends SyncOperation {
  originalOperationIds?: string[];
}

/**
 * Hook to sync pending operations when back online
 */
export function useSyncQueue() {
  const { shouldUseCache } = useOfflineStatus();
  const { getChoreography, choreographies, reloadChoreographies } = useChoreographies();
  const { user } = useAuth();

  useEffect(() => {
    if (shouldUseCache) return;

    // Sync queue when back online
    const syncQueue = async () => {
      const queue = await getSyncQueue();

      if (isEmpty(queue)) return;

      // Group and merge updateChoreography operations for the same choreography
      // Use current local state to ensure we sync the latest state
      const mergedQueue = mergeChoreographyUpdates(queue, getChoreography);

      let hasChoreographyOps = false;
      let hasDeletions = false;

      for (const operation of mergedQueue) {
        try {
          await executeOperation(operation);
          // Track if we had any choreography operations
          if (
            operation.type === 'createChoreography' ||
            operation.type === 'updateChoreography' ||
            operation.type === 'deleteChoreography' ||
            operation.type === 'toggleChoreographyPublic'
          ) {
            hasChoreographyOps = true;
            if (operation.type === 'deleteChoreography') {
              hasDeletions = true;
            }
          }
          // Remove all original operations that were merged into this one
          if (operation.originalOperationIds) {
            for (const originalId of operation.originalOperationIds) {
              await removeFromSyncQueue(originalId);
            }
          } else {
            await removeFromSyncQueue(operation.id);
          }
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          // Increment retry count for all original operations
          if (operation.originalOperationIds) {
            for (const originalId of operation.originalOperationIds) {
              await incrementRetryCount(originalId);
            }
          } else {
            await incrementRetryCount(operation.id);
          }
        }
      }

      // After successful sync of choreography operations, reload from Firestore
      // This ensures we have the latest state from Firestore (especially important for deletions)
      if (hasChoreographyOps && hasDeletions) {
        // Small delay to ensure Firestore has processed the deletion
        setTimeout(() => {
          reloadChoreographies();
        }, 500);
      } else if (hasChoreographyOps) {
        // For other operations, just update cache with current local state
        if (user && user.uid) {
          const cacheKey = `choreographies_${user.uid}`;
          await setCachedData(cacheKey, choreographies);
        }
      }
    };

    // Small delay to ensure network is stable
    const timeout = setTimeout(syncQueue, 1000);
    return () => clearTimeout(timeout);
  }, [shouldUseCache, getChoreography, choreographies, user, reloadChoreographies]);
}

/**
 * Merge multiple updateChoreography operations for the same choreography into one
 * Uses current local state to ensure we sync the latest complete state
 */
function mergeChoreographyUpdates(
  queue: SyncOperation[],
  getChoreography: (id: string) => import('@/types').Choreography | undefined
): MergedSyncOperation[] {
  const merged: MergedSyncOperation[] = [];
  const choreographyUpdates = new Map<
    string,
    {
      operations: SyncOperation[];
      mergedUpdates: any;
    }
  >();

  // First pass: group updateChoreography operations by choreographyId
  for (const operation of queue) {
    if (operation.type === 'updateChoreography' || operation.type === 'toggleChoreographyPublic') {
      const choreographyId = operation.data.choreographyId;
      if (!choreographyUpdates.has(choreographyId)) {
        choreographyUpdates.set(choreographyId, {
          operations: [],
          mergedUpdates: {},
        });
      }
      const group = choreographyUpdates.get(choreographyId)!;
      group.operations.push(operation);

      // Merge updates (later operations override earlier ones)
      if (operation.type === 'toggleChoreographyPublic') {
        group.mergedUpdates.isPublic = operation.data.isPublic;
      } else {
        Object.assign(group.mergedUpdates, operation.data.updates);
      }
    } else {
      // Non-update operations are added as-is
      merged.push(operation);
    }
  }

  // Second pass: create merged operations for each choreography
  // Use current local state to ensure we sync the latest complete state
  for (const [choreographyId, group] of choreographyUpdates.entries()) {
    if (group.operations.length > 0) {
      const firstOperation = group.operations[0];

      // Get current local state of the choreography
      const currentChoreography = getChoreography(choreographyId);

      // If we have the current local state, use it to ensure we sync the complete latest state
      // Otherwise, use the merged updates from the queue
      let finalUpdates = group.mergedUpdates;
      if (currentChoreography) {
        // Use current local state for critical fields that might have changed
        // This ensures we sync the latest state, not just the merged partial updates
        finalUpdates = {
          ...group.mergedUpdates,
          // Always use current movements if they exist in local state
          movements: currentChoreography.movements,
          // Use current name if it was updated
          name: group.mergedUpdates.name ?? currentChoreography.name,
          // Use current danceStyle if it was updated
          danceStyle: group.mergedUpdates.danceStyle ?? currentChoreography.danceStyle,
          danceSubStyle: group.mergedUpdates.danceSubStyle ?? currentChoreography.danceSubStyle,
          complexity: group.mergedUpdates.complexity ?? currentChoreography.complexity,
          phrasesCount: group.mergedUpdates.phrasesCount ?? currentChoreography.phrasesCount,
          // isPublic is handled separately in toggleChoreographyPublic
          isPublic:
            group.mergedUpdates.isPublic !== undefined
              ? group.mergedUpdates.isPublic
              : currentChoreography.isPublic,
        };
      }

      const mergedOperation: MergedSyncOperation = {
        ...firstOperation,
        id: firstOperation.id, // Use first operation's ID
        type: 'updateChoreography',
        data: {
          choreographyId,
          updates: finalUpdates,
        },
        originalOperationIds: group.operations.map((op) => op.id),
      };
      merged.push(mergedOperation);
    }
  }

  // Sort merged operations to maintain order (creates first, then updates, then deletes)
  merged.sort((a, b) => {
    const order = {
      createChoreography: 0,
      updateChoreography: 1,
      toggleChoreographyPublic: 1,
      deleteChoreography: 2,
    };
    const aOrder = order[a.type as keyof typeof order] ?? 3;
    const bOrder = order[b.type as keyof typeof order] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // If same type, maintain original order by timestamp
    return a.timestamp - b.timestamp;
  });

  return merged;
}

async function executeOperation(operation: MergedSyncOperation): Promise<void> {
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
