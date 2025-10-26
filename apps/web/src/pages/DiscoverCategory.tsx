import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { useFigures } from '@/context/FiguresContext';
import { useAuth } from '@/context/AuthContext';
import { FigureCard } from '@/components/FigureCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-col space-y-6 pb-20">
      {/* Header with back button */}
      <div className="px-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/discover')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <h1 className="text-3xl font-bold capitalize">{category}</h1>
        <p className="text-muted-foreground mt-1">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {figures.map((figure) => (
            <FigureCard key={figure.id} figure={figure} />
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleAddFigure}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center z-40"
        aria-label={t('discover.addFigure')}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Auth Dialog */}
      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />

      {/* New Figure Modal */}
      <NewFigureModal
        open={showNewFigureModal}
        onClose={() => setShowNewFigureModal(false)}
        onSubmit={handleSubmitFigure}
      />
    </div>
  );
}

