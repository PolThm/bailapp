import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookOpen, Plus, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

export function Home() {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: t('home.features.learn.title'),
      description: t('home.features.learn.description'),
      link: '/learn',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      icon: Plus,
      title: t('home.features.create.title'),
      description: t('home.features.create.description'),
      link: '/create',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      icon: TrendingUp,
      title: t('home.features.progress.title'),
      description: t('home.features.progress.description'),
      link: '/progress',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
  ];

  return (
    <div className="flex flex-col space-y-8 md:space-y-12">
      {/* Hero Section - Mobile First */}
      <div className="text-center space-y-4 px-4 pt-4 md:pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
          <Sparkles className="h-4 w-4" />
          <span>{t('app.tagline')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          {t('home.welcome')}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t('home.subtitle')}
        </p>
        <div className="pt-2">
          <Link to="/learn">
            <Button 
              size="lg" 
              className="w-full sm:w-auto min-h-[48px] text-base font-semibold active:scale-95 transition-transform touch-manipulation"
            >
              {t('home.cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {features.map((feature) => (
          <Link 
            key={feature.link} 
            to={feature.link}
            className="touch-manipulation active:scale-[0.98] transition-transform"
          >
            <Card className="h-full transition-shadow hover:shadow-lg border-2 hover:border-primary/50">
              <CardHeader className="pb-4">
                <div className='flex items-center gap-3'>
                  <div className={`w-8 h-8 rounded-2xl ${feature.bgColor} flex items-center justify-center`}>
                    <feature.icon className={`h-4 w-4 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full min-h-[44px] justify-between group"
                >
                  <span>{t('nav.' + feature.link.slice(1))}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Additional Info - Mobile Optimized */}
      <div className="text-center text-sm text-muted-foreground px-4 pb-4">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          <span>✨ 100% Free</span>
          <span>•</span>
          <span>📱 Offline Ready</span>
          <span>•</span>
          <span>🌍 Multi-language</span>
        </div>
      </div>
    </div>
  );
}

