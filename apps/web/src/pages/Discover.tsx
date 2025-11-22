import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useFigures } from '@/context/FiguresContext';
import { useAuth } from '@/context/AuthContext';
import { FigureCard } from '@/components/FigureCard';
import { EmptyState } from '@/components/EmptyState';
import { AuthModal } from '@/components/AuthModal';
import { NewFigureModal, type NewFigureFormData } from '@/components/NewFigureModal';
import { AdvancedFiltersModal } from '@/components/AdvancedFiltersModal';
import { SearchAndFilters } from '@/components/SearchAndFilters';
import { ResultsSummary } from '@/components/ResultsSummary';
import { useFigureFilters } from '@/hooks/useFigureFilters';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { getStorageKey, StorageKey } from '@/lib/storageKeys';
import type { Figure } from '@/types';

// Fisher-Yates shuffle algorithm for randomizing array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Discover() {
  const { t } = useTranslation();
  const { figures, addFigure } = useFigures();
  const { user } = useAuth();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImages, setShowImages] = useIndexedDB(getStorageKey(StorageKey.DISCOVER_SHOW_IMAGES), true);
  const [shuffleKey, setShuffleKey] = useState(0);
  // Store the order of figure IDs to maintain stable order when figures are updated
  const figureOrderRef = useRef<Map<string, number>>(new Map());
  const previousFilteredIdsRef = useRef<string>('');
  
  const {
    selectedStyle,
    setSelectedStyle,
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    filteredFigures,
    hasActiveFilters,
    clearFilters,
  } = useFigureFilters(figures);

  // Shuffle figures when arriving on the page or when filters change (only if no filters are active)
  useEffect(() => {
    if (!hasActiveFilters) {
      setShuffleKey(Date.now());
    }
  }, [location.pathname, hasActiveFilters]);

  // Maintain stable order of figures - only reshuffle when filters change or on initial load
  const shuffledFigures = useMemo(() => {
    const currentFilteredIds = filteredFigures.map(f => f.id).join(',');
    const filtersChanged = currentFilteredIds !== previousFilteredIdsRef.current;
    
    if (hasActiveFilters) {
      // Don't shuffle when filters are active - keep consistent results
      previousFilteredIdsRef.current = currentFilteredIds;
      return filteredFigures;
    }
    
    // Only reshuffle if filters changed or it's a new page load
    if (filtersChanged || figureOrderRef.current.size === 0) {
      const shuffled = shuffleArray(filteredFigures);
      // Store the order by ID
      shuffled.forEach((figure, index) => {
        figureOrderRef.current.set(figure.id, index);
      });
      previousFilteredIdsRef.current = currentFilteredIds;
      return shuffled;
    }
    
    // Maintain the existing order even if figures are updated
    const orderedFigures = [...filteredFigures].sort((a, b) => {
      const orderA = figureOrderRef.current.get(a.id) ?? Infinity;
      const orderB = figureOrderRef.current.get(b.id) ?? Infinity;
      return orderA - orderB;
    });
    
    // Add any new figures that weren't in the original order at the end
    const newFigures = filteredFigures.filter(f => !figureOrderRef.current.has(f.id));
    return [...orderedFigures, ...newFigures];
  }, [filteredFigures, hasActiveFilters, shuffleKey]);

  const handleAddFigure = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowNewFigureModal(true);
    }
  };

  const handleSubmitFigure = (data: NewFigureFormData) => {
    const newFigure: Figure = {
      id: `figure-${Date.now()}`,
      ...data,
      importedBy: user?.displayName || 'User',
      createdAt: new Date().toISOString(),
    };
    addFigure(newFigure);
    setShowNewFigureModal(false);
  };

  return (
    <>
      {/* Header */}
      <div className="pb-3">
        <h1 className="text-3xl font-bold">{t('discover.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('discover.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-5">
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
          advancedFilters={advancedFilters}
          onAdvancedFiltersClick={() => setShowAdvancedFilters(true)}
          showImages={showImages}
          onShowImagesChange={setShowImages}
        />
        
        {/* Results Summary */}
        {hasActiveFilters && (
          <ResultsSummary
            count={shuffledFigures.length}
            onClear={clearFilters}
          />
        )}
      </div>

      {/* Figures Grid */}
      {shuffledFigures.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={!hasActiveFilters ? t('discover.empty.title') : t('discover.empty.filtered.title')}
          description={!hasActiveFilters ? t('discover.empty.description') : t('discover.empty.filtered.description')}
          actionLabel={t('discover.empty.action')}
          onAction={handleAddFigure}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {shuffledFigures.map((figure) => (
            <FigureCard key={figure.id} figure={figure} showImage={showImages} />
          ))}
        </div>
      )}

      {/* Auth Dialog */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* New Figure Modal */}
      <NewFigureModal
        open={showNewFigureModal}
        onClose={() => setShowNewFigureModal(false)}
        onSubmit={handleSubmitFigure}
      />

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onApply={() => setShowAdvancedFilters(false)}
        selectedStyle={selectedStyle}
      />
    </>
  );
}

