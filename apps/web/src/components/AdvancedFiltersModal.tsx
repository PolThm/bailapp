import { useTranslation } from 'react-i18next';
import { X, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FigureType, Complexity, VideoLanguage, DanceSubStyle } from '@/types';

export interface AdvancedFilters {
  figureType?: FigureType;
  complexity?: Complexity;
  videoLanguage?: VideoLanguage;
  danceSubStyle?: DanceSubStyle;
}

interface AdvancedFiltersModalProps {
  open: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onApply: () => void;
}

export function AdvancedFiltersModal({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApply,
}: AdvancedFiltersModalProps) {
  const { t } = useTranslation();

  const handleFilterChange = (key: keyof AdvancedFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  const figureTypes: FigureType[] = ['figure', 'basic-step', 'complex-step', 'combination'];
  const complexities: Complexity[] = ['basic', 'basic-intermediate', 'intermediate', 'intermediate-advanced', 'advanced'];
  const videoLanguages: VideoLanguage[] = ['french', 'english', 'spanish'];
  const danceSubStyles: DanceSubStyle[] = [
    'cuban', 'la-style', 'ny-style', 'puerto-rican', 'colombian', 'rueda-de-casino', 'romantica',
    'dominican', 'modern', 'sensual', 'urban', 'fusion', 'ballroom'
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] w-[90vw]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('discover.advancedFilters.title')}</DialogTitle>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Figure Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('discover.advancedFilters.figureType')}</label>
            <Select
              value={filters.figureType || 'all'}
              onValueChange={(value) => handleFilterChange('figureType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('discover.advancedFilters.selectFigureType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('discover.advancedFilters.allTypes')}</SelectItem>
                {figureTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`badges.figureType.${type.replace(/-/g, '')}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Complexity Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('discover.advancedFilters.complexity')}</label>
            <Select
              value={filters.complexity || 'all'}
              onValueChange={(value) => handleFilterChange('complexity', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('discover.advancedFilters.selectComplexity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('discover.advancedFilters.allComplexities')}</SelectItem>
                {complexities.map((complexity) => (
                  <SelectItem key={complexity} value={complexity}>
                    {t(`badges.complexity.${complexity.replace(/-/g, '')}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video Language Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('discover.advancedFilters.videoLanguage')}</label>
            <Select
              value={filters.videoLanguage || 'all'}
              onValueChange={(value) => handleFilterChange('videoLanguage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('discover.advancedFilters.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('discover.advancedFilters.allLanguages')}</SelectItem>
                {videoLanguages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {t(`badges.videoLanguage.${language}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dance Sub-Style Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('discover.advancedFilters.danceSubStyle')}</label>
            <Select
              value={filters.danceSubStyle || 'all'}
              onValueChange={(value) => handleFilterChange('danceSubStyle', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('discover.advancedFilters.selectSubStyle')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('discover.advancedFilters.allSubStyles')}</SelectItem>
                {danceSubStyles.map((subStyle) => (
                  <SelectItem key={subStyle} value={subStyle}>
                    {t(`badges.danceSubStyle.${subStyle.replace(/-/g, '')}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('discover.advancedFilters.activeFilters')}</label>
              <div className="flex flex-wrap gap-2">
                {filters.figureType && (
                  <Badge variant="secondary" className="text-xs">
                    {t(`badges.figureType.${filters.figureType.replace(/-/g, '')}`)}
                  </Badge>
                )}
                {filters.complexity && (
                  <Badge variant="secondary" className="text-xs">
                    {t(`badges.complexity.${filters.complexity.replace(/-/g, '')}`)}
                  </Badge>
                )}
                {filters.videoLanguage && (
                  <Badge variant="secondary" className="text-xs">
                    {t(`badges.videoLanguage.${filters.videoLanguage}`)}
                  </Badge>
                )}
                {filters.danceSubStyle && (
                  <Badge variant="secondary" className="text-xs">
                    {t(`badges.danceSubStyle.${filters.danceSubStyle.replace(/-/g, '')}`)}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
    
          <div className="flex gap-2 pt-4">
            <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasActiveFilters}
                className="flex items-center gap-2"
            >
                <RotateCcw className="h-4 w-4" />
                {t('discover.advancedFilters.reset')}
            </Button>
            <Button onClick={onApply} className="flex-1">
              {t('discover.advancedFilters.apply')}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
