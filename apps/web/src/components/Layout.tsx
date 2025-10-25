import { useEffect, useRef } from 'react';
import { Home, Compass, Heart, Music, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { usePullToRefreshContext } from '@/context/PullToRefreshContext';
import { useOrientation } from '@/hooks/useOrientation';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { refreshHandler } = usePullToRefreshContext();
  const { isLandscapeMobile } = useOrientation();
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
    <div
      className={`p-safe-area-horizontal flex h-screen flex-col overflow-hidden sm:border ${!isLandscapeMobile ? 'p-safe-area' : ''}`}
    >
      {/* Main Content - Mobile Optimized with Padding and Safe Area (72px is the height of the navbar) */}
      <main
        ref={mainRef}
        className={`relative flex flex-col overflow-y-auto px-4 py-5 ${
          isLandscapeMobile ? 'h-[100dvh]' : 'h-[calc(100dvh-72px)]'
        }`}
      >
        <PullToRefreshIndicator
          isPulling={isPulling}
          isRefreshing={isRefreshing}
          pullDistance={pullDistance}
          threshold={80}
        />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">{children}</div>
      </main>

      {/* Bottom Navigation - Mobile Only, Touch-Optimized */}
      <nav
        className={`z-50 border-t bg-background/95 backdrop-blur ${isLandscapeMobile ? 'hidden' : ''}`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-5 gap-1 p-2">
          <Link
            to="/"
            className={`flex min-h-[56px] touch-manipulation flex-col items-center justify-center rounded-lg px-1 py-2 transition-all active:scale-95 ${
              isActive('/') ? 'bg-accent text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="mt-1 text-xs font-medium">{t('nav.home')}</span>
          </Link>
          <Link
            to="/discover"
            className={`flex min-h-[56px] touch-manipulation flex-col items-center justify-center rounded-lg px-1 py-2 transition-all active:scale-95 ${
              isActive('/discover') || location.pathname.startsWith('/discover/')
                ? 'bg-accent text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <Compass className="h-5 w-5" />
            <span className="mt-1 text-xs font-medium">{t('nav.discover')}</span>
          </Link>
          <Link
            to="/favorites"
            className={`flex min-h-[56px] touch-manipulation flex-col items-center justify-center rounded-lg px-1 py-2 transition-all active:scale-95 ${
              isActive('/favorites') ? 'bg-accent text-primary' : 'text-muted-foreground'
            }`}
          >
            <Heart className="h-5 w-5" />
            <span className="mt-1 text-xs font-medium">{t('nav.favorites')}</span>
          </Link>
          <Link
            to="/choreographies"
            className={`flex min-h-[56px] touch-manipulation flex-col items-center justify-center rounded-lg px-1 py-2 transition-all active:scale-95 ${
              isActive('/choreographies') ? 'bg-accent text-primary' : 'text-muted-foreground'
            }`}
          >
            <Music className="h-5 w-5" />
            <span className="mt-1 text-xs font-medium">{t('nav.choreographies')}</span>
          </Link>
          <Link
            to="/profile"
            className={`flex min-h-[56px] touch-manipulation flex-col items-center justify-center rounded-lg px-1 py-2 transition-all active:scale-95 ${
              isActive('/profile') ? 'bg-accent text-primary' : 'text-muted-foreground'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="mt-1 text-xs font-medium">{t('nav.profile')}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
