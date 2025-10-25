import { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

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
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-center text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-center text-muted-foreground">{description}</p>
      <div className="flex flex-col items-center gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} size="lg" className="min-h-[48px]">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            onClick={onSecondaryAction}
            variant="link"
            className="text-sm text-muted-foreground underline"
          >
            {secondaryActionLabel}
          </Button>
        )}
        {!isAuthenticated && onLogin && !secondaryActionLabel && (
          <Button
            onClick={onLogin}
            variant="link"
            className="text-sm text-muted-foreground underline"
          >
            {t('profile.signIn')}
          </Button>
        )}
      </div>
    </div>
  );
}
