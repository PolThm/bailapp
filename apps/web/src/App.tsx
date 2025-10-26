import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { FiguresProvider } from '@/context/FiguresContext';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { Discover } from '@/pages/Discover';
import { DiscoverCategory } from '@/pages/DiscoverCategory';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FiguresProvider>
          <FavoritesProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/discover/:category" element={<DiscoverCategory />} />
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

