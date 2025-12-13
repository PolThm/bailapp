import { useEffect, useRef } from 'react';
import { Home, Compass, Heart, Music, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
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
    // Mobile Optimized with Padding and Safe Area
    <div className="flex h-full w-full flex-col overflow-hidden sm:border">
      <main
        ref={mainRef}
        className={`fixed left-0 right-0 top-0 mb-[env(safe-area-inset-bottom)] flex flex-col overflow-y-auto pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] ${
          isLandscapeMobile ? 'bottom-0' : 'bottom-[72px]'
        }`}
      >
        <PullToRefreshIndicator
          isPulling={isPulling}
          isRefreshing={isRefreshing}
          pullDistance={pullDistance}
          threshold={80}
        />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-5 pt-4 md:pt-6">
          {children}
        </div>
      </main>

      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur ${
          isLandscapeMobile ? 'hidden' : ''
        }`}
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
