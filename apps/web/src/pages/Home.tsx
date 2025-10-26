import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Compass, Heart, Music, ArrowRight } from 'lucide-react';

export function Home() {
  const { t } = useTranslation();

  const options = [
    {
      icon: Compass,
      title: t('home.options.discover.title'),
      description: t('home.options.discover.description'),
      link: '/discover',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      icon: Heart,
      title: t('home.options.favorites.title'),
      description: t('home.options.favorites.description'),
      link: '/favorites',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
    {
      icon: Music,
      title: t('home.options.choreography.title'),
      description: t('home.options.choreography.description'),
      link: '/choreography',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
  ];

  return (
    <div className="flex flex-col space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 px-4 pt-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {t('home.welcome')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('home.subtitle')}
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4 w-full px-4">
        {options.map((option) => (
          <Link 
            key={option.link} 
            to={option.link}
            className="touch-manipulation active:scale-[0.98] transition-transform"
          >
            <Card className="transition-shadow hover:shadow-lg border-2 hover:border-primary/50">
              <CardHeader className="pb-4">
                <div className='flex items-center gap-3'>
                  <div className={`w-12 h-12 rounded-2xl ${option.bgColor} flex items-center justify-center`}>
                    <option.icon className={`h-6 w-6 ${option.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {option.description}
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

