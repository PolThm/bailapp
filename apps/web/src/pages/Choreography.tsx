import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Music, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/AuthDialog';

export function Choreography() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Mock empty choreographies list
  const choreographies: never[] = [];

  const handleNewChoreography = () => {
    if (!user) {
      setShowAuthDialog(true);
    } else {
      // TODO: Open new choreography modal/page
      console.log('Create new choreography');
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="px-4 pt-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('choreography.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('choreography.subtitle')}
          </p>
        </div>
        <Button
          onClick={handleNewChoreography}
          size="lg"
          className="min-h-[48px]"
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('choreography.new')}
        </Button>
      </div>

      {/* Choreographies List or Empty State */}
      {choreographies.length === 0 ? (
        <EmptyState
          icon={Music}
          title={t('choreography.empty.title')}
          description={t('choreography.empty.description')}
          actionLabel={t('choreography.empty.action')}
          onAction={handleNewChoreography}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4">
          {/* TODO: Choreography cards */}
        </div>
      )}

      {/* Auth Dialog */}
      <AuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
    </div>
  );
}

