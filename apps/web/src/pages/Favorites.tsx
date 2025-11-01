import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import { Heart, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useFigures } from '@/context/FiguresContext';
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

export function Favorites() {
  const { t } = useTranslation();
  const { favorites } = useFavorites();
  const { figures, addFigure } = useFigures();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImages, setShowImages] = useIndexedDB(getStorageKey(StorageKey.FAVORITES_SHOW_IMAGES), false);

  // Get favorite figures - ensure favorites is always an array
  const favoriteFiguresData = useMemo(() => {
    if (!favorites || !Array.isArray(favorites)) {
      return [];
    }
    return figures.filter((figure) => favorites.includes(figure.id));
  }, [figures, favorites]);

  // Filter favorite figures
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
  } = useFigureFilters(favoriteFiguresData);

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
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h1 className="text-3xl font-bold">{t('favorites.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('favorites.subtitle')}
            </p>
          </div>
          <button
            onClick={handleAddFigure}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
            aria-label={t('common.addFigure')}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {favoriteFiguresData.length > 0 && (
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
              count={filteredFigures.length}
              onClear={clearFilters}
            />
          )}
        </div>
      )}

      {/* Favorites Grid or Empty State */}
      {filteredFigures.length === 0 ? (
        <EmptyState
          icon={favoriteFiguresData.length === 0 ? Heart : Plus}
          title={favoriteFiguresData.length === 0 ? t('favorites.empty.title') : t('discover.empty.filtered.title')}
          description={favoriteFiguresData.length === 0 ? t('favorites.empty.description') : t('discover.empty.filtered.description')}
          actionLabel={favoriteFiguresData.length === 0 ? t('favorites.empty.action') : t('discover.empty.action')}
          onAction={() => window.location.href = '/discover'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredFigures.map((figure) => (
            <FigureCard key={figure.id} figure={figure} showImage={showImages} showMastery={true} />
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

