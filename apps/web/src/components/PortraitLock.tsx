import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw } from 'lucide-react';

export function PortraitLock() {
  const { t } = useTranslation();
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const landscape = window.matchMedia('(orientation: landscape)').matches;
      setIsLandscape(isMobile && landscape);
    };

    // Check on mount
    checkOrientation();

    // Listen to orientation changes
    const mediaQuery = window.matchMedia('(orientation: landscape)');
    const handleOrientationChange = () => {
      checkOrientation();
    };

    // Listen to resize events as well (for desktop emulation)
    window.addEventListener('resize', checkOrientation);
    mediaQuery.addEventListener('change', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      mediaQuery.removeEventListener('change', handleOrientationChange);
    };
  }, []);

  if (!isLandscape) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-8">
      <div className="text-center text-white space-y-4">
        <div className="mb-6 flex justify-center">
          <RotateCw className="w-16 h-16 text-white animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-bold">{t('orientation.title')}</h2>
        <p className="text-lg opacity-90">{t('orientation.message')}</p>
      </div>
    </div>
  );
}

