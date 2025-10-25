import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function Learn() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">{t('learn.title')}</h1>
        <p className="text-muted-foreground">{t('learn.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <BookOpen className="h-12 w-12 text-blue-500" />
            <div>
              <CardTitle>{t('learn.comingSoon')}</CardTitle>
              <CardDescription>{t('learn.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Hip Hop</h3>
              <p className="text-sm text-muted-foreground">
                Popular street dance styles
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Contemporary</h3>
              <p className="text-sm text-muted-foreground">
                Modern expressive movements
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Ballet</h3>
              <p className="text-sm text-muted-foreground">
                Classical technique fundamentals
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2">Salsa</h3>
              <p className="text-sm text-muted-foreground">
                Latin partner dancing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

