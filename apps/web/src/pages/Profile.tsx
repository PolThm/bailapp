import { useState } from 'react';
import { LogIn, Globe, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthModal } from '@/components/AuthModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

// Get version from environment variable
const APP_VERSION = import.meta.env.VITE_PUBLIC_APP_VERSION || '0.4.0';

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
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4 pt-4">
          {/* Authentication Section */}
          {user ? (
            <Card>
              <CardContent>
                <div className="flex items-center gap-3 pt-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
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
              <CardContent className="flex min-h-[80px] cursor-pointer">
                <div className="flex items-center gap-3 pt-4">
                  <div className="flex-1">
                    <p className="font-semibold">{t('profile.signInRequired')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.signInDescription')}
                    </p>
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
            <CardContent className="mx-auto w-full max-w-lg space-y-3">
              <p className="text-sm text-muted-foreground">{t('profile.selectLanguage')}</p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={i18n.language === 'en' ? 'default' : 'outline'}
                  onClick={() => changeLanguage('en')}
                  className="mx-auto min-h-[48px] justify-start"
                >
                  <span className="mr-3 text-xl">🇬🇧</span>
                  <span className="flex-1 text-left">English</span>
                  {i18n.language === 'en' && <span className="text-xs opacity-70">✓</span>}
                </Button>
                <Button
                  variant={i18n.language === 'fr' ? 'default' : 'outline'}
                  onClick={() => changeLanguage('fr')}
                  className="mx-auto min-h-[48px] justify-start"
                >
                  <span className="mr-3 text-xl">🇫🇷</span>
                  <span className="flex-1 text-left">Français</span>
                  {i18n.language === 'fr' && <span className="text-xs opacity-70">✓</span>}
                </Button>
                <Button
                  variant={i18n.language === 'es' ? 'default' : 'outline'}
                  onClick={() => changeLanguage('es')}
                  className="mx-auto min-h-[48px] justify-start"
                >
                  <span className="mr-3 text-xl">🇪🇸</span>
                  <span className="flex-1 text-left">Español</span>
                  {i18n.language === 'es' && <span className="text-xs opacity-70">✓</span>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mx-auto mt-auto flex w-full flex-col">
            {user ? (
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(true)}
                className="mx-auto min-h-[48px] w-full"
              >
                <LogOut className="mr-2 h-5 w-5" />
                {t('profile.signOut')}
              </Button>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="mx-auto mt-auto w-full"
                size="lg"
              >
                <LogIn className="mr-2 h-5 w-5" />
                {t('profile.signIn')}
              </Button>
            )}

            {/* About text at the bottom */}
            <p className="-mb-2 mt-4 text-center text-xs text-muted-foreground">
              {t('profile.about.version', { version: APP_VERSION })} •{' '}
              {t('profile.about.developed')}{' '}
              <a
                href="https://github.com/PolThm"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Pol Thomas
              </a>
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
