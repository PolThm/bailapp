import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useFigures } from '@/context/FiguresContext';
import { useAuth } from '@/context/AuthContext';
import { FigureCard } from '@/components/FigureCard';
import { EmptyState } from '@/components/EmptyState';
import { AuthDialog } from '@/components/AuthDialog';
import { NewFigureModal, type NewFigureFormData } from '@/components/NewFigureModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { DanceStyle, Figure } from '@/types';

export function Discover() {
  const { t } = useTranslation();
  const { figures, addFigure } = useFigures();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<DanceStyle | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFigures = useMemo(() => {
    let filtered = figures;
    
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
    
    return filtered;
  }, [figures, selectedStyle, searchQuery]);

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
    const salsaCount = figures.filter(f => f.danceStyle === 'salsa').length;
    const bachataCount = figures.filter(f => f.danceStyle === 'bachata').length;
    return { salsa: salsaCount, bachata: bachataCount };
  };

  const styleCounts = getStyleCounts();

  return (
    <>
      {/* Header */}
      <div className="pb-4">
        <h1 className="text-3xl font-bold">{t('discover.title')}</h1>
        {/* <p className="text-muted-foreground mt-1">{t('discover.subtitle')}</p> */}
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
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
          
          {/* Style Filter */}
          <Select value={selectedStyle} onValueChange={(value: DanceStyle | 'all') => setSelectedStyle(value)}>
            <SelectTrigger className="w-full sm:w-[200px] h-11">
              <SelectValue placeholder={t('discover.filter.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <span>{t('discover.filter.all')}</span>
                  <Badge variant="secondary" className="text-xs">
                    {figures.length}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="salsa">
                <div className="flex items-center gap-2">
                  <span>Salsa</span>
                  <Badge variant="secondary" className="text-xs">
                    {styleCounts.salsa}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="bachata">
                <div className="flex items-center gap-2">
                  <span>Bachata</span>
                  <Badge variant="secondary" className="text-xs">
                    {styleCounts.bachata}
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Results Summary */}
        {(searchQuery.trim() || selectedStyle !== 'all') && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {t('discover.results.showing', { count: filteredFigures.length })}
              {searchQuery.trim() && (
                <span className="ml-1">
                  {t('discover.results.for')} "<span className="font-medium text-foreground">{searchQuery}</span>"
                </span>
              )}
              {selectedStyle !== 'all' && (
                <span className="ml-1">
                  {t('discover.results.in')} <span className="font-medium text-foreground capitalize">{selectedStyle}</span>
                </span>
              )}
            </span>
            {(searchQuery.trim() || selectedStyle !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStyle('all');
                }}
                className="text-primary hover:text-primary/80 text-xs underline"
              >
                {t('discover.results.clear')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Figures Grid */}
      {filteredFigures.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={(selectedStyle === 'all' && !searchQuery.trim()) ? t('discover.empty.title') : t('discover.empty.filtered.title')}
          description={(selectedStyle === 'all' && !searchQuery.trim()) ? t('discover.empty.description') : t('discover.empty.filtered.description')}
          actionLabel={t('discover.empty.action')}
          onAction={handleAddFigure}
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
    </>
  );
}

