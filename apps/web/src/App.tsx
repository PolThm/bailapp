import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { FiguresProvider } from '@/context/FiguresContext';
import { Layout } from '@/components/Layout';
import { PWAUpdateNotification } from '@/components/PWAUpdateNotification';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { PortraitLock } from '@/components/PortraitLock';
import { SplashScreen } from '@/components/SplashScreen';
import { Home } from '@/pages/Home';
import { Discover } from '@/pages/Discover';
import { Favorites } from '@/pages/Favorites';
import { Choreography } from '@/pages/Choreography';
import { Profile } from '@/pages/Profile';
import { FigureDetail } from '@/pages/FigureDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Désactiver SplashScreen et PWA Install Prompt en mode développement
const isProduction = import.meta.env.PROD;

function App() {
  const [showSplash, setShowSplash] = useState(isProduction);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FiguresProvider>
          <FavoritesProvider>
            <BrowserRouter>
              <PortraitLock />
              <PWAUpdateNotification />
              {isProduction && <PWAInstallPrompt />}
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/choreography" element={<Choreography />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/figure/:id" element={<FigureDetail />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </FavoritesProvider>
        </FiguresProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

