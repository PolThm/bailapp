import { getItem, setItem } from './indexedDB';

export type SyncOperationType =
  | 'addFavorite'
  | 'removeFavorite'
  | 'updateFavoriteLastOpened'
  | 'updateFavoriteMasteryLevel'
  | 'createChoreography'
  | 'updateChoreography'
  | 'deleteChoreography'
  | 'toggleChoreographyPublic';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  userId: string;
  data: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'sync_queue';
const MAX_RETRIES = 3;

/**
 * Get all pending sync operations from IndexedDB
 */
export async function getSyncQueue(): Promise<SyncOperation[]> {
  try {
    const queueData = await getItem(QUEUE_KEY);
    if (!queueData) return [];
    return JSON.parse(queueData) as SyncOperation[];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
}

/**
 * Add an operation to the sync queue
 */
export async function addToSyncQueue(
  operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>
): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const newOperation: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
    };
    queue.push(newOperation);
    await setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
}

/**
 * Remove an operation from the sync queue
 */
export async function removeFromSyncQueue(operationId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filteredQueue = queue.filter((op) => op.id !== operationId);
    await setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error removing from sync queue:', error);
  }
}

/**
 * Increment retry count for an operation
 */
export async function incrementRetryCount(operationId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const updatedQueue = queue.map((op) => {
      if (op.id === operationId) {
        return { ...op, retries: op.retries + 1 };
      }
      return op;
    });
    await setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error incrementing retry count:', error);
  }
}

/**
 * Clear operations that have exceeded max retries
 */
export async function clearFailedOperations(): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filteredQueue = queue.filter((op) => op.retries < MAX_RETRIES);
    await setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error clearing failed operations:', error);
  }
}
