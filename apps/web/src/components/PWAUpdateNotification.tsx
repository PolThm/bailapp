import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWAUpdate } from '../hooks/usePWAUpdate';

export function PWAUpdateNotification() {
  const { t } = useTranslation();
  const { needRefresh, updateSW } = usePWAUpdate();

  if (!needRefresh) return null;

  return (
    <div className="fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-lg items-center justify-between rounded-lg bg-ring p-4 text-white shadow-lg duration-300 animate-in slide-in-from-top">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5" />
        <div>
          <p className="font-medium">{t('pwa.update.title')}</p>
          <p className="text-sm opacity-90">{t('pwa.update.message')}</p>
        </div>
      </div>
      <button
        onClick={() => updateSW()}
        className="rounded p-1 hover:bg-white/20"
        aria-label={t('pwa.update.close')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
