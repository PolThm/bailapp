import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { LogIn, Globe, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthModal } from '@/components/AuthModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';

// Get version from package.json, do not remove!
const APP_VERSION = '0.2.32';

export function Profile() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      {/* Header */}
      <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
      <div className="flex flex-col flex-1 max-w-lg mx-auto w-full">
        <div className="flex flex-col flex-1 gap-4 pt-4">
          {/* Authentication Section */}
          {user ? (
            <Card>
              <CardContent>
                <div className="flex items-center gap-3 pt-4">
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
          ) : (
            <Card onClick={() => setShowAuthModal(true)}>
              <CardContent className="min-h-[80px] flex cursor-pointer">
                <div className="flex items-center gap-3 pt-4">
                  <div className="flex-1">
                    <p className="font-semibold">{t('profile.signInRequired')}</p>
                    <p className="text-sm text-muted-foreground">{t('profile.signInDescription')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
  
          {/* Language Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <CardTitle className="text-lg">{t('profile.languagePreferences')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-w-lg mx-auto w-full">
              <p className="text-sm text-muted-foreground">
                {t('profile.selectLanguage')}
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={i18n.language === 'en' ? 'default' : 'outline'}
                  onClick={() => changeLanguage('en')}
                  className="min-h-[48px] justify-start mx-auto"
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
                  className="min-h-[48px] justify-start mx-auto"
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
                  className="min-h-[48px] justify-start mx-auto"
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
  
          <div className="mt-auto mx-auto flex flex-col w-full">
            {user ? (
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full min-h-[48px] mx-auto"
              >
                <LogOut className="h-5 w-5 mr-2" />
                {t('profile.signOut')}
              </Button>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="w-full mt-auto mx-auto"
                size="lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                {t('profile.signIn')}
              </Button>
            )}
  
            {/* About text at the bottom */}
            <p className="text-xs text-muted-foreground text-center mt-4 -mb-2">
              {t('profile.about.version', { version: APP_VERSION })} • {t('profile.about.developed')} <a href="https://github.com/PolThm" target="_blank" rel="noopener noreferrer" className="underline">Pol Thomas</a>
            </p>
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('profile.signOutConfirm.title')}
        message={t('profile.signOutConfirm.message')}
        confirmLabel={t('profile.signOut')}
        cancelLabel={t('common.cancel')}
        onConfirm={logout}
        destructive={false}
      />
    </>
  );
}

