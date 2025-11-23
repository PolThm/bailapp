import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Toast } from './Toast';

export function OfflineNotification() {
  const { t } = useTranslation();
  const { isOffline, shouldShowWarning } = useOfflineStatus();
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const [toastMessage, setToastMessage] = useState('');
  const [hasShownWarningToast, setHasShownWarningToast] = useState(false);
  const previousWarningState = useRef(shouldShowWarning);

  useEffect(() => {
    // Show warning toast when going offline or connection becomes slow
    if (shouldShowWarning && !hasShownWarningToast) {
      const message = isOffline
        ? `${t('common.offline.title')} - ${t('common.offline.message')}`
        : `${t('common.offline.verySlowConnection.title')} - ${t('common.offline.verySlowConnection.message')}`;
      
      setToastMessage(message);
      setToastType('error');
      setShowToast(true);
      setHasShownWarningToast(true);
    } 
    // Show success toast when connection is back to normal
    else if (!shouldShowWarning && previousWarningState.current) {
      setToastMessage(t('common.offline.backOnline'));
      setToastType('success');
      setShowToast(true);
      setHasShownWarningToast(false);
    }
    
    previousWarningState.current = shouldShowWarning;
  }, [shouldShowWarning, hasShownWarningToast, isOffline, t]);

  if (!showToast) return null;

  return (
    <Toast
      message={toastMessage}
      type={toastType}
      duration={toastType === 'success' ? 3000 : 8000}
      onClose={() => setShowToast(false)}
    />
  );
}

