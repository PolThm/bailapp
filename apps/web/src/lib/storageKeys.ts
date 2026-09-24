const STORAGE_PREFIX = 'bailapp_';

export enum StorageKey {
  LANGUAGE = 'language',
  DISCOVER_SHOW_IMAGES = 'discover_showImages',
  FAVORITES_SHOW_IMAGES = 'favorites_showImages',
  DISCOVER_FILTERS = 'discover_filters',
  FAVORITES_FILTERS = 'favorites_filters',
  CHOREOGRAPHIES = 'choreographies',
  EXAMPLE_CHOREOGRAPHY_SHOWN = 'exampleChoreographyShown',
  AUTO_FAVOURITED_FIGURES = 'autoFavouritedFigures',
}

/**
 * Get the full storage key with prefix (used with IndexedDB)
 */
export function getStorageKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}
