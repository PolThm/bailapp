import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Music, BookOpen, Plus, TrendingUp, LogOut, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile-First Header - Compact & Touch-Friendly */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo - Always Visible */}
          <Link 
            to="/" 
            className="flex items-center gap-2 active:scale-95 transition-transform touch-manipulation"
            onClick={() => setMenuOpen(false)}
          >
            <Music className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">{t('app.name')}</span>
          </Link>

          {/* Desktop Navigation - Hidden on Mobile */}
          <nav className="hidden md:flex gap-4">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
                isActive('/') ? 'text-primary bg-accent' : 'text-muted-foreground'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/learn"
              className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
                isActive('/learn') ? 'text-primary bg-accent' : 'text-muted-foreground'
              }`}
            >
              {t('nav.learn')}
            </Link>
            <Link
              to="/create"
              className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
                isActive('/create') ? 'text-primary bg-accent' : 'text-muted-foreground'
              }`}
            >
              {t('nav.create')}
            </Link>
            <Link
              to="/progress"
              className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
                isActive('/progress') ? 'text-primary bg-accent' : 'text-muted-foreground'
              }`}
            >
              {t('nav.progress')}
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Language Selector - Compact on Mobile */}
            <div className="hidden sm:flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changeLanguage('en')}
                className={`min-w-[44px] ${i18n.language === 'en' ? 'bg-accent text-primary' : ''}`}
              >
                EN
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changeLanguage('fr')}
                className={`min-w-[44px] ${i18n.language === 'fr' ? 'bg-accent text-primary' : ''}`}
              >
                FR
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changeLanguage('es')}
                className={`min-w-[44px] ${i18n.language === 'es' ? 'bg-accent text-primary' : ''}`}
              >
                ES
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden min-w-[44px] min-h-[44px]"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Auth - Desktop Only */}
            {user && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="hidden md:flex min-h-[44px]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.signOut')}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="p-4 space-y-2">
              {/* Language Selector Mobile */}
              <div className="flex gap-2 pb-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeLanguage('en')}
                  className={`flex-1 min-h-[44px] ${i18n.language === 'en' ? 'bg-accent text-primary' : ''}`}
                >
                  🇬🇧 English
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeLanguage('fr')}
                  className={`flex-1 min-h-[44px] ${i18n.language === 'fr' ? 'bg-accent text-primary' : ''}`}
                >
                  🇫🇷 Français
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeLanguage('es')}
                  className={`flex-1 min-h-[44px] ${i18n.language === 'es' ? 'bg-accent text-primary' : ''}`}
                >
                  🇪🇸 Español
                </Button>
              </div>

              {/* User Info & Logout */}
              {user && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-sm text-muted-foreground px-2">
                    {user.displayName || user.email}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full min-h-[44px]"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.signOut')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Mobile Optimized with Bottom Padding */}
      <main className="flex-1 pb-20 md:pb-8">
        <div className="container px-4 py-4 md:py-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only, Touch-Optimized */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur safe-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">{t('nav.home')}</span>
          </Link>
          <Link
            to="/learn"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/learn') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            <BookOpen className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">{t('nav.learn')}</span>
          </Link>
          <Link
            to="/create"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/create') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">{t('nav.create')}</span>
          </Link>
          <Link
            to="/progress"
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[56px] ${
              isActive('/progress') ? 'text-primary bg-accent' : 'text-muted-foreground'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            <TrendingUp className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">{t('nav.progress')}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

