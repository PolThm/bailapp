import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Music, BookOpen, Plus, TrendingUp, LogOut } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2">
              <Music className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">{t('app.name')}</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/learn"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/learn') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {t('nav.learn')}
              </Link>
              <Link
                to="/create"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/create')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {t('nav.create')}
              </Link>
              <Link
                to="/progress"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/progress')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {t('nav.progress')}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changeLanguage('en')}
                className={i18n.language === 'en' ? 'bg-accent' : ''}
              >
                EN
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changeLanguage('fr')}
                className={i18n.language === 'fr' ? 'bg-accent' : ''}
              >
                FR
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changeLanguage('es')}
                className={i18n.language === 'es' ? 'bg-accent' : ''}
              >
                ES
              </Button>
            </div>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.displayName}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('nav.signOut')}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">{children}</main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
        <div className="flex justify-around py-2">
          <Link
            to="/learn"
            className={`flex flex-col items-center p-2 ${
              isActive('/learn') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs mt-1">{t('nav.learn')}</span>
          </Link>
          <Link
            to="/create"
            className={`flex flex-col items-center p-2 ${
              isActive('/create') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs mt-1">{t('nav.create')}</span>
          </Link>
          <Link
            to="/progress"
            className={`flex flex-col items-center p-2 ${
              isActive('/progress') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs mt-1">{t('nav.progress')}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

