const STORAGE_PREFIX = 'bailapp_';

export enum StorageKey {
  FAVORITES = 'favorites',
  LANGUAGE = 'language',
  DISCOVER_SHOW_IMAGES = 'discover_showImages',
  FAVORITES_SHOW_IMAGES = 'favorites_showImages',
  MASTERY_LEVELS = 'masteryLevels',
}

/**
 * Get the full localStorage key with prefix
 */
export function getStorageKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

