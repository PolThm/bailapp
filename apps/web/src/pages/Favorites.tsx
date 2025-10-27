import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import { Heart, Search, SlidersHorizontal, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useFigures } from '@/context/FiguresContext';
import { FigureCard } from '@/components/FigureCard';
import { EmptyState } from '@/components/EmptyState';
import { AuthDialog } from '@/components/AuthDialog';
import { NewFigureModal, type NewFigureFormData } from '@/components/NewFigureModal';
import { AdvancedFiltersModal, type AdvancedFilters } from '@/components/AdvancedFiltersModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { DanceStyle, Figure } from '@/types';

export function Favorites() {
  const { t } = useTranslation();
  const { favorites } = useFavorites();
  const { figures, addFigure } = useFigures();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<DanceStyle | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});

  // Get favorite figures
  const favoriteFiguresData = useMemo(() => {
    return figures.filter((figure) => favorites.includes(figure.id));
  }, [figures, favorites]);

  // Filter favorite figures
  const filteredFigures = useMemo(() => {
    let filtered = favoriteFiguresData;
    
    // Filter by dance style
    if (selectedStyle !== 'all') {
      filtered = filtered.filter((figure) => figure.danceStyle === selectedStyle);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((figure) => 
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
      filtered = filtered.filter((figure) => figure.videoLanguage === advancedFilters.videoLanguage);
    }
    
    if (advancedFilters.danceSubStyle) {
      filtered = filtered.filter((figure) => figure.danceSubStyle === advancedFilters.danceSubStyle);
    }
    
    return filtered;
  }, [favoriteFiguresData, selectedStyle, searchQuery, advancedFilters]);

  const handleAddFigure = () => {
    if (!user) {
      setShowAuthDialog(true);
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

  const getStyleCounts = () => {
    const salsaCount = favoriteFiguresData.filter(f => f.danceStyle === 'salsa').length;
    const bachataCount = favoriteFiguresData.filter(f => f.danceStyle === 'bachata').length;
    return { salsa: salsaCount, bachata: bachataCount };
  };

  const styleCounts = getStyleCounts();

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
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('discover.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            
            <div className="flex flex-row gap-2">
              {/* Style Filter */}
              <Select value={selectedStyle} onValueChange={(value: DanceStyle | 'all') => setSelectedStyle(value)}>
                <SelectTrigger className="flex-1 h-11">
                  <SelectValue placeholder={t('discover.filter.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <span>{t('discover.filter.all')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="salsa">
                    <div className="flex items-center gap-2">
                      <span>Salsa</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bachata">
                    <div className="flex items-center gap-2">
                      <span>Bachata</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Advanced Filters Button */}
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(true)}
                className="h-11 flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('discover.advancedFilters.button')}
                {Object.values(advancedFilters).some(value => value !== undefined) && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    {Object.values(advancedFilters).filter(value => value !== undefined).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          
          {/* Results Summary */}
          {(searchQuery.trim() || selectedStyle !== 'all' || Object.values(advancedFilters).some(value => value !== undefined)) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {t('discover.results.showing', { count: filteredFigures.length })}
              </span>
              {(searchQuery.trim() || selectedStyle !== 'all' || Object.values(advancedFilters).some(value => value !== undefined)) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStyle('all');
                    setAdvancedFilters({});
                  }}
                  className="text-primary hover:text-primary/80 text-xs underline"
                >
                  {t('discover.results.clear')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Favorites Grid or Empty State */}
      {filteredFigures.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={favoriteFiguresData.length === 0 ? t('favorites.empty.title') : t('discover.empty.filtered.title')}
          description={favoriteFiguresData.length === 0 ? t('favorites.empty.description') : t('discover.empty.filtered.description')}
          actionLabel={favoriteFiguresData.length === 0 ? t('favorites.empty.action') : undefined}
          onAction={favoriteFiguresData.length === 0 ? () => window.location.href = '/discover' : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFigures.map((figure) => (
            <FigureCard key={figure.id} figure={figure} />
          ))}
        </div>
      )}

      {/* Auth Dialog */}
      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />

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

