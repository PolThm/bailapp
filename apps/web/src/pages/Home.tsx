import { Compass, Heart, Music, ArrowRight } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import dancingCoupleLogo from '@/images/dancing-couple-transparent.png';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

export function Home() {
  const { t } = useTranslation();
  const posthog = usePostHog();

  const options = [
    {
      icon: Compass,
      title: t('home.options.discover.title'),
      description: t('home.options.discover.description'),
      link: '/discover',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient:
        'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950',
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
      title: t('home.options.choreographies.title'),
      description: t('home.options.choreographies.description'),
      link: '/choreographies',
      gradient: 'from-violet-500 to-purple-600',
      bgGradient:
        'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <>
      <div className="flex flex-1 flex-col justify-center pt-4">
        {/* Hero Section */}
        <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
          <div className="mb-2 inline-flex items-center justify-center md:mb-0">
            <img src={dancingCoupleLogo} alt="Bailapp" className="h-16 w-16" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              {t('home.welcome').split('Bailapp')[0]}
              <span className="text-primary">Bailapp</span>
            </h1>
            <p className="mx-auto max-w-sm text-lg text-muted-foreground md:text-2xl">
              {t('home.subtitle')}
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 py-4 md:grid md:max-w-4xl md:grid-cols-3 md:grid-rows-1 md:items-start">
          {options.map((option, index) => (
            <Link
              key={option.link}
              to={option.link}
              className="w-full touch-manipulation transition-all duration-200 active:scale-[0.97]"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => {
                trackEvent(posthog, AnalyticsEvents.HOME_CARD_CLICKED, {
                  card_title: option.title,
                  destination: option.link,
                });
              }}
            >
              <Card className="relative overflow-hidden border-0 bg-card/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:h-[200px] md:text-center">
                <div className={`absolute inset-0 opacity-5 ${option.bgGradient}`} />

                <CardHeader className="relative h-full p-4">
                  <div className="flex items-center justify-between md:flex-col md:items-center md:justify-between md:gap-3">
                    {/* Text + Icon */}
                    <div className="flex-1 space-y-1 md:flex md:flex-col md:items-center">
                      <div className="flex items-center gap-2 md:flex-col md:gap-1">
                        <option.icon className={`h-6 w-6 ${option.iconColor}`} />
                        <CardTitle className="text-lg font-semibold leading-tight md:text-xl">
                          {option.title}
                        </CardTitle>
                      </div>

                      <CardDescription className="max-w-xs text-sm text-muted-foreground">
                        {option.description}
                      </CardDescription>
                    </div>

                    {/* Arrow */}
                    <div className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 md:ml-0 md:mt-2">
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
