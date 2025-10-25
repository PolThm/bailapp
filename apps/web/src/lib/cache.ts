import { getItem, setItem, removeItem } from './indexedDB';

const CACHE_PREFIX = 'cache_';
const CACHE_TIMESTAMP_PREFIX = 'cache_timestamp_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get cached data from IndexedDB
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cachedData = await getItem(`${CACHE_PREFIX}${key}`);
    const cachedTimestamp = await getItem(`${CACHE_TIMESTAMP_PREFIX}${key}`);

    if (!cachedData || !cachedTimestamp) {
      return null;
    }

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();

    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY_MS) {
      // Cache expired, remove it
      await removeItem(`${CACHE_PREFIX}${key}`);
      await removeItem(`${CACHE_TIMESTAMP_PREFIX}${key}`);
      return null;
    }

    return JSON.parse(cachedData) as T;
  } catch (error) {
    console.error(`Error getting cached data for ${key}:`, error);
    return null;
  }
}

/**
 * Set cached data in IndexedDB
 */
export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    await setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
    await setItem(`${CACHE_TIMESTAMP_PREFIX}${key}`, Date.now().toString());
  } catch (error) {
    console.error(`Error setting cached data for ${key}:`, error);
  }
}

/**
 * Clear cached data from IndexedDB
 */
export async function clearCachedData(key: string): Promise<void> {
  try {
    await removeItem(`${CACHE_PREFIX}${key}`);
    await removeItem(`${CACHE_TIMESTAMP_PREFIX}${key}`);
  } catch (error) {
    console.error(`Error clearing cached data for ${key}:`, error);
  }
}
