import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if an array or string is empty
 * @param value Array or string to check
 * @returns true if the value has length 0, false otherwise
 */
export function isEmpty<T extends { length: number }>(value: T): boolean {
  return value.length === 0;
}

/**
 * Sort items by lastOpenedAt (most recent first), then by createdAt for those without lastOpenedAt
 * @param items Array of items with lastOpenedAt and createdAt properties
 * @returns Sorted array
 */
export function sortByLastOpened<T extends { lastOpenedAt?: string; createdAt: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    // If both have lastOpenedAt, sort by most recent first
    if (a.lastOpenedAt && b.lastOpenedAt) {
      return new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime();
    }
    // If only a has lastOpenedAt, it comes first
    if (a.lastOpenedAt && !b.lastOpenedAt) {
      return -1;
    }
    // If only b has lastOpenedAt, it comes first
    if (!a.lastOpenedAt && b.lastOpenedAt) {
      return 1;
    }
    // If neither has lastOpenedAt, sort by createdAt (most recent first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Format a byte count as a short human-readable size (e.g. "68.4 MB")
 * @param bytes Size in bytes
 * @returns Formatted string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}
