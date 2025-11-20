import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  isAuthenticated?: boolean;
  onLogin?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  isAuthenticated = true,
  onLogin,
}: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm text-center">{description}</p>
      <div className="flex flex-col gap-3 items-center">
        {actionLabel && onAction && (
          <Button onClick={onAction} size="lg" className="min-h-[48px]">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="link" className="text-sm text-muted-foreground underline">
            {secondaryActionLabel}
          </Button>
        )}
        {!isAuthenticated && onLogin && !secondaryActionLabel && (
          <Button onClick={onLogin} variant="link" className="text-sm text-muted-foreground underline">
            {t('profile.signIn')}
          </Button>
        )}
      </div>
    </div>
  );
}

