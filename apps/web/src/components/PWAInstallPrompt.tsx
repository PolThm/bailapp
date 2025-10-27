import { Download, X, Smartphone, Share, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

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
      <div className="fixed bottom-28 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom duration-500 fade-in">
        <Card className="bg-primary border-primary max-w-sm w-full shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Download Button */}
              <Button
                onClick={handleInstallClick}
                variant="secondary"
                size="icon"
                className="flex-shrink-0 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Text */}
              <p className="text-sm font-medium text-primary-foreground flex-1 ml-3">
                {t('pwa.install.title')}
              </p>

              {/* Close Button */}
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="icon"
                className="flex-shrink-0 text-primary-foreground hover:text-foreground hover:bg-white/20"
              >
                <X className="h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Installation Instructions Dialog */}
      <Dialog open={showManualInstructions} onOpenChange={setShowManualInstructions}>
        <DialogContent className="w-[90vw] max-w-lg space-y-4">
          <DialogHeader>
            <DialogTitle>
              {t('pwa.install.instructions.title')}
            </DialogTitle>
          </DialogHeader>
          
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowManualInstructions(false)}
            >
              {t('pwa.install.instructions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
