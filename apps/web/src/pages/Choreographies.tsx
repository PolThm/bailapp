import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Music, Plus } from 'lucide-react';
import { useChoreographies } from '@/context/ChoreographiesContext';
import { EmptyState } from '@/components/EmptyState';
import { AuthModal } from '@/components/AuthModal';
import { NewChoreographyModal } from '@/components/NewChoreographyModal';
import { ChoreographyCard } from '@/components/ChoreographyCard';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/Loader';
import { Toast } from '@/components/Toast';
import { sortByLastOpened } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function Choreographies() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const { choreographies, followedChoreographies, isLoading } = useChoreographies();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewChoreographyModal, setShowNewChoreographyModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Check for toast message in navigation state
  useEffect(() => {
    if (location.state?.toast) {
      setToast(location.state.toast);
      // Clear the state to avoid showing the toast again on re-render
      window.history.replaceState({ ...location.state, toast: null }, '');
    }
  }, [location.state]);

  const handleNewChoreography = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowNewChoreographyModal(true);
  };

  // Sort choreographies by lastOpenedAt (most recent first), then by createdAt for those without lastOpenedAt
  const sortedChoreographies = sortByLastOpened(choreographies);
  const sortedFollowedChoreographies = sortByLastOpened(followedChoreographies);

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
      {isLoading ? (
        <Loader />
      ) : sortedChoreographies.length === 0 && sortedFollowedChoreographies.length === 0 ? (
        <EmptyState
          icon={Music}
          title={t('choreographies.empty.title')}
          description={t('choreographies.empty.description')}
          actionLabel={t('choreographies.empty.action')}
          onAction={handleNewChoreography}
          isAuthenticated={!!user}
          onLogin={() => setShowAuthModal(true)}
        />
      ) : (
        <div className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
          {/* My Choreographies */}
          {sortedChoreographies.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('choreographies.myChoreographies')}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
                {sortedChoreographies.map((choreography) => (
                  <ChoreographyCard key={choreography.id} choreography={choreography} isFollowed={false} />
                ))}
              </div>
            </div>
          )}
          
          {/* Followed Choreographies */}
          {sortedFollowedChoreographies.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('choreographies.followed')}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
                {sortedFollowedChoreographies.map((choreography) => (
                  <ChoreographyCard key={`followed-${choreography.id}-${choreography.ownerId}`} choreography={choreography} isFollowed={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Button at Bottom */}
      {(sortedChoreographies.length > 0 || sortedFollowedChoreographies.length > 0) && (
        <div className="mt-auto pt-6 mx-auto">
          <Button
            onClick={handleNewChoreography}
            className="w-full"
            variant="default"
            size="lg"
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

