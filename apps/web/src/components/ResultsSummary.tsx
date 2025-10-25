import { useTranslation } from 'react-i18next';

interface ResultsSummaryProps {
  count: number;
  onClear: () => void;
}

export function ResultsSummary({ count, onClear }: ResultsSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{t('discover.results.showing', { count })}</span>
      <button onClick={onClear} className="text-xs text-primary underline hover:text-primary/80">
        {t('discover.results.clear')}
      </button>
    </div>
  );
}
