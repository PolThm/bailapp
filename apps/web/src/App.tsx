import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { OfflineNotification } from '@/components/OfflineNotification';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { PWAUpdateNotification } from '@/components/PWAUpdateNotification';
import { SplashScreen } from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ChoreographiesProvider } from '@/context/ChoreographiesContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { FiguresProvider } from '@/context/FiguresContext';
import { PullToRefreshProvider } from '@/context/PullToRefreshContext';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { Choreographies } from '@/pages/Choreographies';
import { ChoreographyDetail } from '@/pages/ChoreographyDetail';
import { Discover } from '@/pages/Discover';
import { Favorites } from '@/pages/Favorites';
import { FigureDetail } from '@/pages/FigureDetail';
import { Home } from '@/pages/Home';
import { Profile } from '@/pages/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// TODO: Allow users to update videos !!

// Disable SplashScreen and PWA Install Prompt in development
const isProduction = import.meta.env.PROD;

// Internal component that handles splash screen based on auth loading
function AppContent() {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [shouldHideSplash, setShouldHideSplash] = useState(false);
  useSyncQueue(); // Sync pending operations when back online

  useEffect(() => {
    if (!loading && showSplash) {
      // Wait 500ms before starting to hide the splash screen
      const timer = setTimeout(() => {
        setShouldHideSplash(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, showSplash]);

  // Show splash screen while loading
  if (loading || showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} shouldHide={shouldHideSplash} />;
  }

  return (
    <BrowserRouter>
      <PWAUpdateNotification />
      {isProduction && <PWAInstallPrompt />}
      <OfflineNotification />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/choreographies" element={<Choreographies />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/figure/:id" element={<FigureDetail />} />
          <Route path="/choreography/:id" element={<ChoreographyDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>
          <FiguresProvider>
            <ChoreographiesProvider>
              <PullToRefreshProvider>
                <AppContent />
              </PullToRefreshProvider>
            </ChoreographiesProvider>
          </FiguresProvider>
        </FavoritesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
