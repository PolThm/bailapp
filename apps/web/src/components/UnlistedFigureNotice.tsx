import { EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Figure } from '@/types';
import { isUnlistedFigure } from '@/utils/figureVideo';

/**
 * Marks a figure that is not in the public catalogue.
 *
 * Unlisted figures reach people through a shared link, so they can turn up
 * next to catalogue figures in favourites and search results. Without a mark,
 * nothing would tell the two apart.
 */

/** Full-width banner for the figure detail page. */
export function UnlistedFigureNotice({ figure }: { figure: Figure }) {
  const { t } = useTranslation();

  if (!isUnlistedFigure(figure)) {
    return null;
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
      <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0 text-sm font-medium">
        {t('figure.unlisted.title', { author: figure.importedBy })}
      </p>
    </div>
  );
}

/** Compact corner badge for grid and carousel cards. */
export function UnlistedFigureBadge({ figure }: { figure: Figure }) {
  const { t } = useTranslation();

  if (!isUnlistedFigure(figure)) {
    return null;
  }

  return (
    <div
      className="absolute left-2 top-2 z-30 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white"
      title={t('figure.unlisted.title', { author: figure.importedBy })}
    >
      <EyeOff className="h-3 w-3" />
      {t('figure.unlisted.badge')}
    </div>
  );
}
