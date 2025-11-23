import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Toast } from './Toast';

export function OfflineNotification() {
  const { t } = useTranslation();
  const { isOffline, shouldShowWarning } = useOfflineStatus();
  const [showToast, setShowToast] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    // Show toast when going offline or connection becomes very slow
    if (shouldShowWarning && !hasShownToast) {
      setShowToast(true);
      setHasShownToast(true);
    } else if (!shouldShowWarning) {
      // Reset when connection is back to normal
      setHasShownToast(false);
    }
  }, [shouldShowWarning, hasShownToast]);

  if (!showToast) return null;

  const message = isOffline
    ? `${t('common.offline.title')} - ${t('common.offline.message')}`
    : `${t('common.offline.verySlowConnection.title')} - ${t('common.offline.verySlowConnection.message')}`;

  return (
    <Toast
      message={message}
      type="error"
      duration={8000}
      onClose={() => setShowToast(false)}
    />
  );
}

