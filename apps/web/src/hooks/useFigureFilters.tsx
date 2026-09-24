import { useEffect, useMemo, useState } from 'react';
import type { AdvancedFilters } from '@/components/AdvancedFiltersModal';
import type { DanceStyle, Figure } from '@/types';
import { getStorageKey, type StorageKey } from '@/lib/storageKeys';
import { getFigureVideoFormat } from '@/utils/figureVideo';

interface StoredFigureFilters {
  selectedStyle: DanceStyle | 'all';
  searchQuery: string;
  advancedFilters: AdvancedFilters;
}

const DEFAULT_FILTERS: StoredFigureFilters = {
  selectedStyle: 'all',
  searchQuery: '',
  advancedFilters: {},
};

function readStoredFilters(key: string): StoredFigureFilters {
  try {
    const stored = sessionStorage.getItem(key);
    return stored ? { ...DEFAULT_FILTERS, ...JSON.parse(stored) } : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

// Filters persist per page in sessionStorage, so they survive navigating away and back
export function useFigureFilters(figures: Figure[], storageKey: StorageKey) {
  const key = getStorageKey(storageKey);
  const [initialFilters] = useState(() => readStoredFilters(key));
  const [selectedStyle, setSelectedStyle] = useState(initialFilters.selectedStyle);
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [advancedFilters, setAdvancedFilters] = useState(initialFilters.advancedFilters);

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ selectedStyle, searchQuery, advancedFilters }));
    } catch {
      // Storage can be unavailable (private mode, quota); filters then just reset on remount
    }
  }, [key, selectedStyle, searchQuery, advancedFilters]);

  const filteredFigures = useMemo(() => {
    let filtered = figures;

    // Filter by dance style
    if (selectedStyle !== 'all') {
      filtered = filtered.filter((figure) => figure.danceStyle === selectedStyle);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (figure) =>
          figure.shortTitle.toLowerCase().includes(query) ||
          figure.fullTitle.toLowerCase().includes(query) ||
          (figure.description && figure.description.toLowerCase().includes(query))
      );
    }

    // Apply advanced filters
    if (advancedFilters.figureType) {
      filtered = filtered.filter((figure) => figure.figureType === advancedFilters.figureType);
    }

    if (advancedFilters.complexity) {
      filtered = filtered.filter((figure) => figure.complexity === advancedFilters.complexity);
    }

    if (advancedFilters.videoLanguage) {
      filtered = filtered.filter(
        (figure) => figure.videoLanguage === advancedFilters.videoLanguage
      );
    }

    if (advancedFilters.videoFormat) {
      filtered = filtered.filter(
        (figure) => getFigureVideoFormat(figure) === advancedFilters.videoFormat
      );
    }

    if (advancedFilters.danceSubStyle) {
      filtered = filtered.filter(
        (figure) => figure.danceSubStyle === advancedFilters.danceSubStyle
      );
    }

    return filtered;
  }, [figures, selectedStyle, searchQuery, advancedFilters]);

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedStyle !== 'all' ||
    Object.values(advancedFilters).some((value) => value !== undefined && value !== false);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStyle('all');
    setAdvancedFilters({});
  };

  return {
    selectedStyle,
    setSelectedStyle,
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    filteredFigures,
    hasActiveFilters,
    clearFilters,
  };
}
