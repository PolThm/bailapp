import { useState, useMemo } from 'react';
import { Heart, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdvancedFiltersModal } from '@/components/AdvancedFiltersModal';
import { AuthModal } from '@/components/AuthModal';
import { ComingSoonModal } from '@/components/ComingSoonModal';
import { EmptyState } from '@/components/EmptyState';
import { FigureCard } from '@/components/FigureCard';
import { Loader } from '@/components/Loader';
import { ResultsSummary } from '@/components/ResultsSummary';
import { SearchAndFilters } from '@/components/SearchAndFilters';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useFigureFilters } from '@/hooks/useFigureFilters';
import { useFigures } from '@/hooks/useFigures';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { getStorageKey, StorageKey } from '@/lib/storageKeys';
import { isEmpty, sortByLastOpened } from '@/lib/utils';

export function Favorites() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites, isLoading } = useFavorites();
  const { figures, shorts } = useFigures();
  const { user } = useAuth();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showImages, setShowImages] = useIndexedDB(
    getStorageKey(StorageKey.FAVORITES_SHOW_IMAGES),
    false
  );

  // Get favorite figures - ensure favorites is always an array, sorted by lastOpenedAt
  // Include both figures and shorts
  const favoriteFiguresData = useMemo(() => {
    if (!favorites || !Array.isArray(favorites)) {
      return [];
    }
    // Combine figures and shorts
    const allFigures = [...figures, ...shorts];
    const favoriteFigures = allFigures.filter((figure) => favorites.includes(figure.id));
    return sortByLastOpened(favoriteFigures);
  }, [figures, shorts, favorites]);

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
    setShowComingSoonModal(true);
  };

  return (
    <>
      {/* Header */}
      <div className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h1 className="text-3xl font-bold">{t('favorites.title')}</h1>
            <p className="mt-1 text-muted-foreground">{t('favorites.subtitle')}</p>
          </div>
          <button
            onClick={handleAddFigure}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:shadow-lg active:scale-95"
            aria-label={t('common.addFigure')}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {/* Filters */}
          {favoriteFiguresData.length > 0 && (
            <div className="mb-5 space-y-4">
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
                <ResultsSummary count={filteredFigures.length} onClear={clearFilters} />
              )}
            </div>
          )}

          {/* Favorites Grid or Empty State */}
          {isEmpty(filteredFigures) ? (
            <EmptyState
              icon={isEmpty(favoriteFiguresData) ? Heart : Plus}
              title={
                isEmpty(favoriteFiguresData)
                  ? t('favorites.empty.title')
                  : t('discover.empty.filtered.title')
              }
              description={
                isEmpty(favoriteFiguresData)
                  ? t('favorites.empty.description')
                  : t('discover.empty.filtered.description')
              }
              actionLabel={
                isEmpty(favoriteFiguresData)
                  ? t('favorites.empty.action')
                  : t('discover.empty.action')
              }
              onAction={() => navigate('/discover')}
              isAuthenticated={!!user}
              onLogin={() => setShowAuthModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {filteredFigures.map((figure) => (
                <FigureCard
                  key={figure.id}
                  figure={figure}
                  showImage={showImages}
                  showMastery={true}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Auth Dialog */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Coming Soon Modal */}
      <ComingSoonModal open={showComingSoonModal} onClose={() => setShowComingSoonModal(false)} />

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
