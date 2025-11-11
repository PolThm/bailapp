import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, Share2, Apple } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
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

  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Detect platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const isAndroid = /Android/.test(navigator.userAgent);

  useEffect(() => {
    if (showInstallPrompt && !isInstalled) {
      setShouldRender(true);
      setIsExiting(false);
    } else if (!showInstallPrompt && shouldRender) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showInstallPrompt, isInstalled, shouldRender]);

  // Don't show if we shouldn't render
  if ((isInstalled || !shouldRender) && !isExiting) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Snackbar */}
      <div className={`fixed bottom-24 left-4 right-4 z-50 flex justify-center transition-all duration-500 max-w-[350px] mx-auto ${
        isExiting 
          ? 'animate-out slide-out-to-bottom fade-out' 
          : 'animate-in slide-in-from-bottom fade-in'
      }`}>
        <Card className="bg-primary border-primary max-w-sm w-full shadow-xl cursor-pointer">
          <CardContent 
            className="p-4"
            onClick={handleInstallClick}
          >
            <div className="flex items-center justify-between">
              {/* Download Button */}
              <Button
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
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
        <DialogContent className="space-y-6">
          <DialogHeader onClose={() => setShowManualInstructions(false)}>
            <DialogTitle>{t('pwa.install.instructions.title')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isIOS ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Apple className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="font-semibold text-base">iPhone</p>
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-primary mr-1">1.</span>
                    <span>{t('pwa.install.instructions.ios1')}</span>
                    <Share className="h-4 w-4 mt-0.5 flex-shrink-0 text-foreground" />
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-primary mr-1">2.</span>
                    <Trans
                      i18nKey="pwa.install.instructions.ios2"
                      components={{ b: <strong className="font-bold text-foreground" /> }}
                    />
                  </li>
                </ol>
              </div>
            ) : isAndroid ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="font-semibold text-base">Android</p>
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-primary mr-1">1.</span>
                    <Trans
                      i18nKey="pwa.install.instructions.android1"
                      components={{ b: <strong className="font-bold text-foreground" /> }}
                    />
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-primary mr-1">2.</span>
                    <Trans
                      i18nKey="pwa.install.instructions.android2"
                      components={{ b: <strong className="font-bold text-foreground" /> }}
                    />
                  </li>
                  <li className="flex items-start gap-1 ml-5">
                    <Trans
                      i18nKey="pwa.install.instructions.android3"
                      components={{ b: <strong className="font-bold text-foreground" /> }}
                    />
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="font-semibold text-base">{t('pwa.install.instructions.otherLabel')}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  <Trans
                    i18nKey="pwa.install.instructions.other"
                    components={{ b: <strong className="font-semibold text-foreground" /> }}
                  />
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {t('pwa.install.instructions.intro')}
          </p>

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
