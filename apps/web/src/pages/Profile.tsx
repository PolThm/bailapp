import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { LogIn, Globe, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthModal } from '@/components/AuthModal';

// Get version from package.json, do not remove!
const APP_VERSION = '0.0.68';

export function Profile() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      {/* Header */}
      <h1 className="text-3xl font-bold">{t('profile.title')}</h1>

      <div className="flex-1 flex flex-col">
        {/* Language Preferences */}
        <Card className="my-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle className="text-lg">{t('profile.languagePreferences')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('profile.selectLanguage')}
          </p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant={i18n.language === 'en' ? 'default' : 'outline'}
              onClick={() => changeLanguage('en')}
              className="min-h-[48px] justify-start"
            >
              <span className="text-xl mr-3">🇬🇧</span>
              <span className="flex-1 text-left">English</span>
              {i18n.language === 'en' && (
                <span className="text-xs opacity-70">✓</span>
              )}
            </Button>
            <Button
              variant={i18n.language === 'fr' ? 'default' : 'outline'}
              onClick={() => changeLanguage('fr')}
              className="min-h-[48px] justify-start"
            >
              <span className="text-xl mr-3">🇫🇷</span>
              <span className="flex-1 text-left">Français</span>
              {i18n.language === 'fr' && (
                <span className="text-xs opacity-70">✓</span>
              )}
            </Button>
            <Button
              variant={i18n.language === 'es' ? 'default' : 'outline'}
              onClick={() => changeLanguage('es')}
              className="min-h-[48px] justify-start"
            >
              <span className="text-xl mr-3">🇪🇸</span>
              <span className="flex-1 text-left">Español</span>
              {i18n.language === 'es' && (
                <span className="text-xs opacity-70">✓</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Authentication Section */}
        {user ? (
          <div className="space-y-4 mt-auto pt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{user.displayName || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button
              variant="outline"
              onClick={logout}
              className="w-full min-h-[48px]"
            >
              <LogOut className="h-5 w-5 mr-2" />
              {t('profile.signOut')}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowAuthModal(true)}
            className="w-full min-h-[48px] mt-auto"
          >
            <LogIn className="h-5 w-5 mr-2" />
            {t('profile.signIn')}
          </Button>
        )}
        
        {/* About text at the bottom */}
        <p className="text-xs text-muted-foreground text-center mt-4 -mb-1">
          {t('profile.about.version', { version: APP_VERSION })} • {t('profile.about.developed')} <a href="https://github.com/PolThm" target="_blank" rel="noopener noreferrer" className="underline">Pol Thomas</a>
        </p>
      </div>

      {/* Auth Dialog */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

