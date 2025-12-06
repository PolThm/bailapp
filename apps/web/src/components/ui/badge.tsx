import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';
import type { DanceStyle, DanceSubStyle, FigureType, Complexity, VideoLanguage } from '@/types';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',

        // Dance styles
        salsa: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',
        bachata: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100',

        // Figure types
        figure: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
        'basic-step': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
        'complex-step': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100',
        mix: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100',

        // Complexity
        basic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
        'basic-intermediate':
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100',
        intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
        'intermediate-advanced':
          'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100',
        advanced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',

        // Languages
        french: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
        english: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100',
        spanish: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100',
        italian: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',

        // Dance substyles - Salsa
        'salsa-cuban': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100',
        'salsa-la-style': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
        'salsa-ny-style': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
        'salsa-puerto-rican': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',
        'salsa-colombian': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100',
        'salsa-rueda-de-casino':
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
        'salsa-romantica': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100',

        // Dance substyles - Bachata
        'bachata-dominican':
          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100',
        'bachata-modern': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-100',
        'bachata-sensual': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100',
        'bachata-urban': 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-100',
        'bachata-fusion': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-100',
        'bachata-ballroom': 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Helper components for specific badge types
export function DanceStyleBadge({ style }: { style: DanceStyle }) {
  const { t } = useTranslation();
  return <Badge variant={style}>{t(`badges.danceStyle.${style}`)}</Badge>;
}

export function FigureTypeBadge({ type }: { type: FigureType }) {
  const { t } = useTranslation();
  const typeKey = type.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return <Badge variant={type}>{t(`badges.figureType.${typeKey}`)}</Badge>;
}

export function ComplexityBadge({ complexity }: { complexity: Complexity }) {
  const { t } = useTranslation();
  const complexityKey = complexity.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return <Badge variant={complexity}>{t(`badges.complexity.${complexityKey}`)}</Badge>;
}

export function LanguageBadge({ language }: { language: VideoLanguage }) {
  const { t } = useTranslation();
  const flags = {
    french: '🇫🇷',
    english: '🇬🇧',
    spanish: '🇪🇸',
    italian: '🇮🇹',
  };
  return (
    <Badge variant={language}>
      {flags[language]} {t(`badges.videoLanguage.${language}`)}
    </Badge>
  );
}

type ValidSubStyleVariant =
  | 'salsa-cuban'
  | 'salsa-la-style'
  | 'salsa-ny-style'
  | 'salsa-puerto-rican'
  | 'salsa-colombian'
  | 'salsa-rueda-de-casino'
  | 'salsa-romantica'
  | 'bachata-dominican'
  | 'bachata-modern'
  | 'bachata-sensual'
  | 'bachata-urban'
  | 'bachata-fusion'
  | 'bachata-ballroom';

export function DanceSubStyleBadge({
  style,
  subStyle,
}: {
  style: DanceStyle;
  subStyle: DanceSubStyle;
}) {
  const formatSubStyle = (subStyle: DanceSubStyle) => {
    return subStyle
      .replace(/-/g, '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  };
  const { t } = useTranslation();
  const variantKey = `${style}-${subStyle}` as ValidSubStyleVariant;
  const validVariants: ValidSubStyleVariant[] = [
    'salsa-cuban',
    'salsa-la-style',
    'salsa-ny-style',
    'salsa-puerto-rican',
    'salsa-colombian',
    'salsa-rueda-de-casino',
    'salsa-romantica',
    'bachata-dominican',
    'bachata-modern',
    'bachata-sensual',
    'bachata-urban',
    'bachata-fusion',
    'bachata-ballroom',
  ];
  const variant: ValidSubStyleVariant | 'default' = validVariants.includes(variantKey)
    ? variantKey
    : 'default';
  return <Badge variant={variant}>{t(`badges.danceSubStyle.${formatSubStyle(subStyle)}`)}</Badge>;
}

export { Badge };
