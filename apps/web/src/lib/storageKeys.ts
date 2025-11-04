const STORAGE_PREFIX = 'bailapp_';

export enum StorageKey {
  FAVORITES = 'favorites',
  LANGUAGE = 'language',
  DISCOVER_SHOW_IMAGES = 'discover_showImages',
  FAVORITES_SHOW_IMAGES = 'favorites_showImages',
  MASTERY_LEVELS = 'masteryLevels',
  CHOREOGRAPHIES = 'choreographies',
  EXAMPLE_CHOREOGRAPHY_SHOWN = 'exampleChoreographyShown',
}

/**
 * Get the full storage key with prefix (used with IndexedDB)
 */
export function getStorageKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

