import { Download, X, Smartphone, Share, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const {
    showInstallPrompt,
    isInstalled,
    showManualInstructions,
    setShowManualInstructions,
    handleInstallClick,
    handleDismiss,
  } = usePWAInstall();

  // Don't show if already installed
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Snackbar */}
      <div className="fixed bottom-28 left-4 right-4 z-50 flex justify-center">
        <div className="bg-primary border border-border rounded-lg shadow-lg p-4 max-w-sm w-full">
          <div className="flex items-center justify-between gap-3">
            {/* Download Button */}
            <button
              onClick={handleInstallClick}
              className="flex-shrink-0 bg-primary-foreground text-primary p-2 rounded hover:bg-primary-foreground/90 transition-colors"
            >
              <Download className="h-4 w-4 text-foreground" />
            </button>

            {/* Text */}
            <p className="text-sm font-medium text-primary-foreground flex-1">
              {t('pwa.install.title')}
            </p>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-primary-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Installation Instructions Dialog */}
      {showManualInstructions && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 grid max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg w-[90vw]">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {t('pwa.install.instructions.title')}
              </h2>
            </div>
            
            <div className="space-y-4">
              {/* Android / Chrome */}
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Android / Chrome</p>
                  <p className="text-sm text-muted-foreground">
                    {t('pwa.install.instructions.android')}
                  </p>
                </div>
              </div>

              {/* iOS / Safari */}
              <div className="flex items-start gap-3">
                <Share className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">iOS / Safari / Chrome</p>
                  <p className="text-sm text-muted-foreground">
                    {t('pwa.install.instructions.ios')}
                  </p>
                </div>
              </div>

              {/* Other browsers */}
              <div className="flex items-start gap-3">
                <Share2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{t('pwa.install.instructions.otherLabel')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('pwa.install.instructions.other')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <button
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                onClick={() => setShowManualInstructions(false)}
              >
                {t('pwa.install.instructions.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
