import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { useFigures } from '@/context/FiguresContext';
import { useAuth } from '@/context/AuthContext';
import { FigureCard } from '@/components/FigureCard';
import { EmptyState } from '@/components/EmptyState';
import { AuthDialog } from '@/components/AuthDialog';
import { NewFigureModal, type NewFigureFormData } from '@/components/NewFigureModal';
import type { DanceStyle, Figure } from '@/types';

export function DiscoverCategory() {
  const { category } = useParams<{ category: DanceStyle }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getFiguresByCategory, addFigure } = useFigures();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);

  const figures = category ? getFiguresByCategory(category) : [];

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
      {/* Header with back icon */}
      <div className="pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/discover')}
            className="h-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all touch-manipulation"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold capitalize">{category}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('discover.category.subtitle', { count: figures.length })}
        </p>
      </div>

      {/* Figures Grid */}
      {figures.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={t('discover.empty.title')}
          description={t('discover.empty.description')}
          actionLabel={t('discover.empty.action')}
          onAction={handleAddFigure}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {figures.map((figure) => (
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

