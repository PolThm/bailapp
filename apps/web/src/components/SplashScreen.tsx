import { useEffect, useState } from 'react';
import { WifiOff, ArrowRight, Plane } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import dancingCoupleLogo from '@/images/dancing-couple-transparent.png';

interface SplashScreenProps {
  onFinish: () => void;
  shouldHide?: boolean;
}

export function SplashScreen({ onFinish, shouldHide = false }: SplashScreenProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [showSlowConnectionTip, setShowSlowConnectionTip] = useState(false);

  useEffect(() => {
    // Show slow connection tip after 5 seconds
    const tipTimeout = setTimeout(() => {
      setShowSlowConnectionTip(true);
    }, 5000);

    if (shouldHide && isVisible) {
      setIsVisible(false);
      // Call onFinish after fade animation completes
      setTimeout(onFinish, 300);
    }

    return () => {
      clearTimeout(tipTimeout);
    };
  }, [shouldHide, isVisible, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-primary pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <img src={dancingCoupleLogo} alt="Bailapp" className="mb-6 h-32 w-32 animate-pulse" />
      <h1 className="text-4xl font-bold text-white">Bailapp</h1>
      <p className="mt-2 text-white/80">{t('app.tagline')}</p>
      {showSlowConnectionTip && (
        <div className="absolute bottom-8 left-4 right-4 mx-auto flex max-w-md flex-col items-center gap-2 px-4 duration-500 animate-in fade-in">
          <div className="flex items-center gap-2 text-white/70">
            <WifiOff className="h-5 w-5" />
            <ArrowRight className="h-4 w-4" />
            <Plane className="h-5 w-5" />
          </div>
          <p className="text-center text-sm text-white/70">{t('app.slowConnectionTip')}</p>
        </div>
      )}
    </div>
  );
}
