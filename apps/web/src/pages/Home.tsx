import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Compass, Heart, Music, ArrowRight } from 'lucide-react';
import dancingCoupleLogo from '@/components/icons/dancing-couple.png';

export function Home() {
  const { t } = useTranslation();

  const options = [
    {
      icon: Compass,
      title: t('home.options.discover.title'),
      description: t('home.options.discover.description'),
      link: '/discover',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Heart,
      title: t('home.options.favorites.title'),
      description: t('home.options.favorites.description'),
      link: '/favorites',
      gradient: 'from-rose-500 to-pink-600',
      bgGradient: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      icon: Music,
      title: t('home.options.choreography.title'),
      description: t('home.options.choreography.description'),
      link: '/choreography',
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <>
      <div className="flex flex-col justify-center pb-8 pt-2 flex-1">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center mb-2">
            <img
              src={dancingCoupleLogo}
              alt="Bailapp"
              className="h-16 w-16"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              {t('home.welcome').split('Bailapp')[0]}
              <span className="text-primary">Bailapp</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-sm mx-auto">
              {t('home.subtitle')}
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="flex flex-col w-full flex-1 justify-around items-center">
          {options.map((option, index) => (
            <Link 
              key={option.link} 
              to={option.link}
              className="touch-manipulation active:scale-[0.97] transition-all duration-200 w-full"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm">
                <div className={`absolute inset-0 opacity-5 ${option.bgGradient}`} />
                <CardHeader className="relative p-4">
                  <div className='flex items-center justify-between'>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <option.icon className={`h-5 w-5 ${option.iconColor} flex-shrink-0`} />
                        <CardTitle className="text-lg font-semibold leading-tight">{option.title}</CardTitle>
                      </div>
                      <CardDescription className="text-sm text-muted-foreground">
                        {option.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 ml-3">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

