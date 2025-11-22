import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWAUpdate } from '../hooks/usePWAUpdate';

export function PWAUpdateNotification() {
  const { t } = useTranslation();
  const { needRefresh, updateSW } = usePWAUpdate();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-ring text-white p-4 rounded-lg shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5" />
        <div>
          <p className="font-medium">{t('pwa.update.title')}</p>
          <p className="text-sm opacity-90">{t('pwa.update.message')}</p>
        </div>
      </div>
      <button
        onClick={() => updateSW()}
        className="p-1 hover:bg-white/20 rounded"
        aria-label={t('pwa.update.close')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
