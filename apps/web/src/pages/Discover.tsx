import { useTranslation } from 'react-i18next';
import { useState } from 'react';
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

export function Discover() {
  const { t } = useTranslation();
  const { figures, addFigure } = useFigures();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImages, setShowImages] = useIndexedDB(getStorageKey(StorageKey.DISCOVER_SHOW_IMAGES), true);
  
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
            count={filteredFigures.length}
            onClear={clearFilters}
          />
        )}
      </div>

      {/* Figures Grid */}
      {filteredFigures.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={!hasActiveFilters ? t('discover.empty.title') : t('discover.empty.filtered.title')}
          description={!hasActiveFilters ? t('discover.empty.description') : t('discover.empty.filtered.description')}
          actionLabel={t('discover.empty.action')}
          onAction={handleAddFigure}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredFigures.map((figure) => (
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

