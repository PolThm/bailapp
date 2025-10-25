const STORAGE_PREFIX = 'bailapp_';

export enum StorageKey {
  LANGUAGE = 'language',
  DISCOVER_SHOW_IMAGES = 'discover_showImages',
  FAVORITES_SHOW_IMAGES = 'favorites_showImages',
  CHOREOGRAPHIES = 'choreographies',
  EXAMPLE_CHOREOGRAPHY_SHOWN = 'exampleChoreographyShown',
}

/**
 * Get the full storage key with prefix (used with IndexedDB)
 */
export function getStorageKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}
