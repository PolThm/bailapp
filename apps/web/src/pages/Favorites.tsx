import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { useFigures } from '@/context/FiguresContext';
import { FigureCard } from '@/components/FigureCard';
import { EmptyState } from '@/components/EmptyState';

export function Favorites() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { figures } = useFigures();

  const favoriteFigures = figures.filter((figure) =>
    favorites.includes(figure.id)
  );

  return (
    <div className="flex flex-col space-y-6">
      {/* Header with Add Button */}
      <div className="px-4 pt-6 flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h1 className="text-3xl font-bold">{t('favorites.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('favorites.subtitle', { count: favoriteFigures.length })}
          </p>
        </div>
        <button
          onClick={() => navigate('/discover')}
          className="w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
          aria-label={t('favorites.empty.action')}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Favorites Grid or Empty State */}
      {favoriteFigures.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('favorites.empty.title')}
          description={t('favorites.empty.description')}
          actionLabel={t('favorites.empty.action')}
          onAction={() => navigate('/discover')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {favoriteFigures.map((figure) => (
            <FigureCard key={figure.id} figure={figure} />
          ))}
        </div>
      )}
    </div>
  );
}

