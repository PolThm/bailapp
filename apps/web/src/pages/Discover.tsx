import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Music2, ArrowRight } from 'lucide-react';

export function Discover() {
  const { t } = useTranslation();

  const categories = [
    {
      id: 'salsa',
      title: 'Salsa',
      description: t('discover.categories.salsa.description'),
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950',
      gradient: 'from-red-500 to-orange-500',
    },
    {
      id: 'bachata',
      title: 'Bachata',
      description: t('discover.categories.bachata.description'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="px-4 pt-6">
        <h1 className="text-3xl font-bold">{t('discover.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('discover.subtitle')}</p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-4 px-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/discover/${category.id}`}
            className="touch-manipulation active:scale-[0.98] transition-transform"
          >
            <Card className="transition-shadow hover:shadow-lg border-2 hover:border-primary/50 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${category.gradient}`} />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl ${category.bgColor} flex items-center justify-center`}
                  >
                    <Music2 className={`h-7 w-7 ${category.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{category.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {category.description}
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

