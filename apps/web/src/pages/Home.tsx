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
import { BookOpen, Plus, TrendingUp, ArrowRight } from 'lucide-react';

export function Home() {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: t('home.features.learn.title'),
      description: t('home.features.learn.description'),
      link: '/learn',
      color: 'text-blue-500',
    },
    {
      icon: Plus,
      title: t('home.features.create.title'),
      description: t('home.features.create.description'),
      link: '/create',
      color: 'text-purple-500',
    },
    {
      icon: TrendingUp,
      title: t('home.features.progress.title'),
      description: t('home.features.progress.description'),
      link: '/progress',
      color: 'text-green-500',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {t('home.welcome')}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t('home.subtitle')}
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link to="/learn">
            <Button size="lg">
              {t('home.cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
        {features.map((feature) => (
          <Link key={feature.link} to={feature.link}>
            <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
              <CardHeader>
                <feature.icon className={`h-12 w-12 mb-4 ${feature.color}`} />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  {t('nav.' + feature.link.slice(1))}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-muted-foreground max-w-2xl">
        <p>
          {t('app.tagline')} • 100% Free • Available Offline • Multi-language Support
        </p>
      </div>
    </div>
  );
}

