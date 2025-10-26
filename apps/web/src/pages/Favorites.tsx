import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useFigures } from '@/context/FiguresContext';
import { FigureCard } from '@/components/FigureCard';
import { EmptyState } from '@/components/EmptyState';
import { AuthDialog } from '@/components/AuthDialog';
import { NewFigureModal, type NewFigureFormData } from '@/components/NewFigureModal';
import type { Figure } from '@/types';

export function Favorites() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { figures, addFigure } = useFigures();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);

  const favoriteFigures = figures.filter((figure) =>
    favorites.includes(figure.id)
  );

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

  return (
    <>
      {/* Header with Add Button */}
      <div className="pb-6 flex items-start justify-between">
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

      {/* Favorites Grid or Empty State */}
      {favoriteFigures.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('favorites.empty.title')}
          description={t('favorites.empty.description')}
          actionLabel={t('favorites.empty.action')}
          onAction={() => navigate('/discover')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteFigures.map((figure) => (
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

