import { useState, useEffect } from 'react';
import { Music, Plus, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { AuthModal } from '@/components/AuthModal';
import { ChoreographyCard } from '@/components/ChoreographyCard';
import { EmptyState } from '@/components/EmptyState';
import { Loader } from '@/components/Loader';
import { NewChoreographyModal } from '@/components/NewChoreographyModal';
import { Toast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useChoreographies } from '@/context/ChoreographiesContext';
import { isEmpty, sortByLastOpened } from '@/lib/utils';

export function Choreographies() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const { choreographies, followedChoreographies, isLoading } = useChoreographies();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewChoreographyModal, setShowNewChoreographyModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

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
          <p className="mt-1 text-muted-foreground">{t('choreographies.subtitle')}</p>
        </div>
        <button
          onClick={handleNewChoreography}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:shadow-lg active:scale-95"
          aria-label={t('choreographies.new')}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Choreographies List or Empty State */}
      {isLoading ? (
        <Loader />
      ) : isEmpty(sortedChoreographies) && isEmpty(sortedFollowedChoreographies) ? (
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
        <div className="mt-4 space-y-6 sm:mt-6 sm:space-y-8">
          {/* My Choreographies */}
          {sortedChoreographies.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">
                {t('choreographies.myChoreographies')}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
                {sortedChoreographies.map((choreography) => (
                  <ChoreographyCard
                    key={choreography.id}
                    choreography={choreography}
                    isFollowed={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Followed Choreographies */}
          {sortedFollowedChoreographies.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">
                {t('choreographies.followed')}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
                {sortedFollowedChoreographies.map((choreography) => (
                  <ChoreographyCard
                    key={`followed-${choreography.id}-${choreography.ownerId}`}
                    choreography={choreography}
                    isFollowed={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Button at Bottom */}
      {(sortedChoreographies.length > 0 || sortedFollowedChoreographies.length > 0) && (
        <div className="mt-auto flex w-full justify-center pt-6">
          {!user ? (
            <Button onClick={() => setShowAuthModal(true)} className="w-full" size="lg">
              <LogIn className="mr-2 h-5 w-5" />
              {t('profile.signIn')}
            </Button>
          ) : (
            <Button onClick={handleNewChoreography} className="w-full" variant="default" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              {t('choreographies.empty.action')}
            </Button>
          )}
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
