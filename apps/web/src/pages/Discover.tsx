import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
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
import type { DanceStyle, Figure } from '@/types';

export function Discover() {
  const { t } = useTranslation();
  const { figures, addFigure } = useFigures();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<DanceStyle | 'all'>('all');

  const filteredFigures = useMemo(() => {
    if (selectedStyle === 'all') {
      return figures;
    }
    return figures.filter((figure) => figure.danceStyle === selectedStyle);
  }, [figures, selectedStyle]);

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
        <p className="text-muted-foreground mt-1">{t('discover.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          {/* <Filter className="h-4 w-4 text-muted-foreground" /> */}
          <Select value={selectedStyle} onValueChange={(value: DanceStyle | 'all') => setSelectedStyle(value)}>
            <SelectTrigger className="w-[200px]">
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
      </div>

      {/* Figures Grid */}
      {filteredFigures.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={selectedStyle === 'all' ? t('discover.empty.title') : t('discover.empty.filtered.title')}
          description={selectedStyle === 'all' ? t('discover.empty.description') : t('discover.empty.filtered.description', { style: selectedStyle === 'salsa' ? 'Salsa' : 'Bachata' })}
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

