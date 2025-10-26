import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { DanceStyle, FigureType, Complexity, VideoLanguage } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
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
        combination: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100',
        
        // Complexity
        basic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100',
        'basic-intermediate': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100',
        intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
        'intermediate-advanced': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100',
        advanced: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',
        
        // Languages
        french: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
        english: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100',
        spanish: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100',
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
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
  };
  return <Badge variant={language}>{flags[language]} {t(`badges.videoLanguage.${language}`)}</Badge>;
}

export { Badge, badgeVariants };

