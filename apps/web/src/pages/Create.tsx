import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useAuthPrompt } from '@/hooks/useAuthPrompt';
import { AuthDialog } from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, Save } from 'lucide-react';

export function Create() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { requireAuth, showAuthDialog, closeAuthDialog } = useAuthPrompt();

  const handleSaveChoreography = async () => {
    await requireAuth(() => {
      // TODO: Implement save choreography logic
      console.log('Saving choreography...');
      alert('Choreography saved!');
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">{t('create.title')}</h1>
        <p className="text-muted-foreground">{t('create.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Plus className="h-12 w-12 text-purple-500" />
              <div>
                <CardTitle>{t('create.comingSoon')}</CardTitle>
                <CardDescription className='mt-2'>{t('create.description')}</CardDescription>
              </div>
            </div>
            <Button onClick={handleSaveChoreography}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Placeholder for choreography builder */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              <p className="mb-4">Choreography builder interface will go here</p>
              <p className="text-sm">
                {!user && t('create.requiresAuth')}
              </p>
            </div>

            {/* Example sections */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Drag & Drop</h3>
                <p className="text-sm text-muted-foreground">
                  Add moves from the library
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  Arrange moves in sequence
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuthDialog open={showAuthDialog} onClose={closeAuthDialog} />
    </div>
  );
}

