import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendingUp, Clock, Target, Award } from 'lucide-react';

export function Progress() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">
          {t('progress.title')}
        </h1>
        <p className="text-muted-foreground">{t('progress.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <TrendingUp className="h-12 w-12 text-green-500" />
            <div>
              <CardTitle>{t('progress.comingSoon')}</CardTitle>
              <CardDescription>{t('progress.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!user ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('progress.requiresAuth')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-6 w-6 text-blue-500" />
                  <h3 className="font-semibold">Practice Time</h3>
                </div>
                <p className="text-2xl font-bold">0 hours</p>
                <p className="text-sm text-muted-foreground">This week</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-6 w-6 text-purple-500" />
                  <h3 className="font-semibold">Moves Learned</h3>
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Plus className="h-6 w-6 text-orange-500" />
                  <h3 className="font-semibold">Choreographies</h3>
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Created</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-6 w-6 text-yellow-500" />
                  <h3 className="font-semibold">Achievements</h3>
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Unlocked</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const Plus = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

