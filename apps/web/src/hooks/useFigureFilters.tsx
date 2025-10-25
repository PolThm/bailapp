import { useMemo, useState } from 'react';
import type { AdvancedFilters } from '@/components/AdvancedFiltersModal';
import type { DanceStyle, Figure } from '@/types';
import { isYouTubeShort } from '@/utils/youtube';

export function useFigureFilters(figures: Figure[]) {
  const [selectedStyle, setSelectedStyle] = useState<DanceStyle | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});

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
      filtered = filtered.filter((figure) => {
        const isShort = isYouTubeShort(figure.youtubeUrl);
        return advancedFilters.videoFormat === 'short' ? isShort : !isShort;
      });
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
    Object.values(advancedFilters).some((value) => value !== undefined);

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
