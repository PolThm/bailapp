import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useAuthPrompt() {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const requireAuth = useCallback(
    async (action: () => void | Promise<void>) => {
      if (!user) {
        setShowAuthDialog(true);
        return false;
      }
      await action();
      return true;
    },
    [user]
  );

  const closeAuthDialog = useCallback(() => {
    setShowAuthDialog(false);
  }, []);

  return {
    requireAuth,
    showAuthDialog,
    closeAuthDialog,
  };
}

