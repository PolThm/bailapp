import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Music, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/EmptyState';
import { AuthModal } from '@/components/AuthModal';

export function Choreographies() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Mock empty choreographies list
  const choreographies: never[] = [];

  const handleNewChoreography = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      // TODO: Open new choreography modal/page
      console.log('Create new choreography');
    }
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
        <div className="grid grid-cols-1 gap-4">
          {/* TODO: Choreography cards */}
        </div>
      )}

      {/* Auth Dialog */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

