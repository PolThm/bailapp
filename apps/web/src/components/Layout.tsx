import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Compass, Heart, Music, User } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { usePullToRefreshContext } from '@/context/PullToRefreshContext';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { refreshHandler } = usePullToRefreshContext();
  const mainRef = useRef<HTMLElement | null>(null);

  // Scroll to top when route changes
  useEffect(() => mainRef.current?.scrollTo(0, 0), [location.pathname]);

  const { isPulling, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      if (refreshHandler) {
        await refreshHandler();
      } else {
        // Default refresh: reload the page
        window.location.reload();
      }
    },
    enabled: true,
    threshold: 80,
    elementRef: mainRef,
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen sm:border p-safe-area overflow-hidden">
      {/* Main Content - Mobile Optimized with Padding and Safe Area (72px is the height of the navbar) */}
      <main 
        ref={mainRef}
        className="flex flex-col px-4 py-5 h-[calc(100dvh-72px)] overflow-y-auto relative"
      >
        <PullToRefreshIndicator
          isPulling={isPulling}
          isRefreshing={isRefreshing}
          pullDistance={pullDistance}
          threshold={80}
        />
        <div className="flex flex-1 flex-col w-full max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Bottom Navigation - Mobile Only, Touch-Optimized */}
      <nav className="z-50 border-t bg-background/95 backdrop-blur">
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
            to="/choreographies"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/choreographies') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
          >
            <Music className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">{t('nav.choreographies')}</span>
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

