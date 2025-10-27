import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Compass, Heart, Music, User } from 'lucide-react';
import { SplashScreen } from './SplashScreen';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  // if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content - Mobile Optimized with Padding */}
      <main className="flex flex-col flex-1 min-h-screen px-5 p-safe-nave container max-w-7xl mx-auto">
          {children}
      </main>

      {/* Bottom Navigation - Mobile Only, Touch-Optimized */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur safe-bottom">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">{t('nav.home')}</span>
          </Link>
          <Link
            to="/discover"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/discover') || location.pathname.startsWith('/discover/') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
          >
            <Compass className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">{t('nav.discover')}</span>
          </Link>
          <Link
            to="/favorites"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/favorites') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">{t('nav.favorites')}</span>
          </Link>
          <Link
            to="/choreography"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/choreography') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
          >
            <Music className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">{t('nav.choreography')}</span>
          </Link>
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/profile') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">{t('nav.profile')}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

