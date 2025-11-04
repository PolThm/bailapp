import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Music, Plus } from 'lucide-react';
import { useChoreographies } from '@/context/ChoreographiesContext';
import { EmptyState } from '@/components/EmptyState';
import { AuthModal } from '@/components/AuthModal';
import { NewChoreographyModal } from '@/components/NewChoreographyModal';
import { ChoreographyCard } from '@/components/ChoreographyCard';
import { Button } from '@/components/ui/button';

export function Choreographies() {
  const { t } = useTranslation();
  const { choreographies } = useChoreographies();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewChoreographyModal, setShowNewChoreographyModal] = useState(false);

  const handleNewChoreography = () => {
    setShowNewChoreographyModal(true);
  };

  return (
    <>
      {/* Header with Add Button */}
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h1 className="text-3xl font-bold">{t('choreographies.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('choreographies.subtitle')}
          </p>
        </div>
        <button
          onClick={handleNewChoreography}
          className="w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
          aria-label={t('choreographies.new')}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Choreographies List or Empty State */}
      {choreographies.length === 0 ? (
        <EmptyState
          icon={Music}
          title={t('choreographies.empty.title')}
          description={t('choreographies.empty.description')}
          actionLabel={t('choreographies.empty.action')}
          onAction={handleNewChoreography}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 mt-6">
          {choreographies.map((choreography) => (
            <ChoreographyCard key={choreography.id} choreography={choreography} />
          ))}
        </div>
      )}

      {/* Add Button at Bottom */}
      {choreographies.length > 0 && (
        <div className="mt-auto pt-6">
          <Button
            onClick={handleNewChoreography}
            className="w-full"
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('choreographies.empty.action')}
          </Button>
        </div>
      )}

      {/* Auth Dialog */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* New Choreography Modal */}
      <NewChoreographyModal
        open={showNewChoreographyModal}
        onClose={() => setShowNewChoreographyModal(false)}
      />
    </>
  );
}

