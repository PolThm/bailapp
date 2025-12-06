import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FigureType, Complexity, VideoLanguage, DanceSubStyle, VideoFormat } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface AdvancedFilters {
  figureType?: FigureType;
  complexity?: Complexity;
  videoLanguage?: VideoLanguage;
  videoFormat?: VideoFormat;
  danceSubStyle?: DanceSubStyle;
  danceStyle?: 'salsa' | 'bachata';
}

interface AdvancedFiltersModalProps {
  open: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onApply: () => void;
  selectedStyle: 'all' | 'salsa' | 'bachata';
  hideVideoFormat?: boolean;
}

export function AdvancedFiltersModal({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  selectedStyle,
  hideVideoFormat = false,
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

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined);

  const figureTypes: FigureType[] = ['figure', 'basic-step', 'complex-step', 'mix'];
  const complexities: Complexity[] = [
    'basic',
    'basic-intermediate',
    'intermediate',
    'intermediate-advanced',
    'advanced',
  ];
  const videoLanguages: VideoLanguage[] = ['french', 'english', 'spanish', 'italian'];
  const videoFormats: VideoFormat[] = ['classic', 'short'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader onClose={onClose} className="mb-0">
          <DialogTitle>{t('discover.advancedFilters.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {/* Video Format Filter */}
          {!hideVideoFormat && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('discover.advancedFilters.videoFormat')}
              </label>
              <Select
                value={filters.videoFormat || 'all'}
                onValueChange={(value) => handleFilterChange('videoFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('discover.advancedFilters.selectFormat')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('discover.advancedFilters.allFormats')}</SelectItem>
                  {videoFormats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {t(`badges.videoFormat.${format}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Figure Type Filter */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('discover.advancedFilters.figureType')}
            </label>
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
            <label className="text-sm font-medium">
              {t('discover.advancedFilters.complexity')}
            </label>
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
            <label className="text-sm font-medium">
              {t('discover.advancedFilters.videoLanguage')}
            </label>
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
            <label className="text-sm font-medium">
              {t('discover.advancedFilters.danceSubStyle')}
            </label>
            <Select
              value={filters.danceSubStyle || 'all'}
              onValueChange={(value) => handleFilterChange('danceSubStyle', value)}
              disabled={!filters.danceStyle && selectedStyle === 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('discover.advancedFilters.selectSubStyle')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('discover.advancedFilters.allSubStyles')}</SelectItem>
                {(filters.danceStyle === 'salsa' || selectedStyle === 'salsa') && (
                  <>
                    <SelectItem value="cuban">{t('badges.danceSubStyle.cuban')}</SelectItem>
                    <SelectItem value="la-style">{t('badges.danceSubStyle.lastyle')}</SelectItem>
                    <SelectItem value="ny-style">{t('badges.danceSubStyle.nystyle')}</SelectItem>
                    <SelectItem value="puerto-rican">
                      {t('badges.danceSubStyle.puertorican')}
                    </SelectItem>
                    <SelectItem value="colombian">{t('badges.danceSubStyle.colombian')}</SelectItem>
                    <SelectItem value="rueda-de-casino">
                      {t('badges.danceSubStyle.ruedadecasino')}
                    </SelectItem>
                    <SelectItem value="romantica">{t('badges.danceSubStyle.romantica')}</SelectItem>
                  </>
                )}
                {(filters.danceStyle === 'bachata' || selectedStyle === 'bachata') && (
                  <>
                    <SelectItem value="dominican">{t('badges.danceSubStyle.dominican')}</SelectItem>
                    <SelectItem value="modern">{t('badges.danceSubStyle.modern')}</SelectItem>
                    <SelectItem value="sensual">{t('badges.danceSubStyle.sensual')}</SelectItem>
                    <SelectItem value="urban">{t('badges.danceSubStyle.urban')}</SelectItem>
                    <SelectItem value="fusion">{t('badges.danceSubStyle.fusion')}</SelectItem>
                    <SelectItem value="ballroom">{t('badges.danceSubStyle.ballroom')}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {!filters.danceStyle && selectedStyle === 'all' && (
              <p className="text-[10px] text-muted-foreground">
                {t('discover.advancedFilters.subStyleHint')}
              </p>
            )}
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('discover.advancedFilters.activeFilters')}
              </label>
              <div className="flex flex-wrap gap-2">
                {!hideVideoFormat && filters.videoFormat && (
                  <Badge variant="secondary" className="text-xs">
                    {t(`badges.videoFormat.${filters.videoFormat}`)}
                  </Badge>
                )}
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
        <div className="flex gap-2 pt-2">
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
