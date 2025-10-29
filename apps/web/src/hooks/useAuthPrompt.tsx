import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useAuthPrompt() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = useCallback(
    async (action: () => void | Promise<void>) => {
      if (!user) {
        setShowAuthModal(true);
        return false;
      }
      await action();
      return true;
    },
    [user]
  );

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return {
    requireAuth,
    showAuthModal,
    closeAuthModal,
  };
}

