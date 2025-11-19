import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { t } = useTranslation();
  const { signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Failed to sign in:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader onClose={onClose}>
          <DialogTitle>{t('auth.signInRequired')}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mt-2">{t('auth.signInToSave')}</DialogDescription>
        <div className="flex flex-col gap-4 py-4">
          <Button onClick={handleSignIn} className="w-full">
            {t('auth.signInWithGoogle')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

