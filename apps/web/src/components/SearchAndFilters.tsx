import { Search, SlidersHorizontal, Image, ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AdvancedFilters } from '@/components/AdvancedFiltersModal';
import type { DanceStyle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedStyle: DanceStyle | 'all';
  onStyleChange: (value: DanceStyle | 'all') => void;
  advancedFilters: AdvancedFilters;
  onAdvancedFiltersClick: () => void;
  showImages: boolean;
  onShowImagesChange: (value: boolean) => void;
}

export function SearchAndFilters({
  searchQuery,
  onSearchChange,
  selectedStyle,
  onStyleChange,
  advancedFilters,
  onAdvancedFiltersClick,
  showImages,
  onShowImagesChange,
}: SearchAndFiltersProps) {
  const { t } = useTranslation();

  const activeFiltersCount = Object.values(advancedFilters).filter(
    (value) => value !== undefined
  ).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input with Toggle Button */}
      <div className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('discover.search.placeholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 pl-10"
          />
        </div>

        {/* Images Toggle Button */}
        <Button
          variant="outline"
          onClick={() => onShowImagesChange(!showImages)}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center p-0 sm:w-11"
          aria-label={showImages ? 'Hide images' : 'Show images'}
          title={showImages ? 'Hide images' : 'Show images'}
        >
          {showImages ? <Image className="h-4 w-4" /> : <ImageOff className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex flex-row gap-2">
        {/* Style Filter */}
        <Select value={selectedStyle} onValueChange={onStyleChange}>
          <SelectTrigger className="h-11 flex-1">
            <SelectValue placeholder={t('discover.filter.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span>{t('discover.filter.all')}</span>
              </div>
            </SelectItem>
            <SelectItem value="salsa">
              <div className="flex items-center gap-2">
                <span>Salsa</span>
              </div>
            </SelectItem>
            <SelectItem value="bachata">
              <div className="flex items-center gap-2">
                <span>Bachata</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Button */}
        <Button
          variant="outline"
          onClick={onAdvancedFiltersClick}
          className="flex h-11 w-36 items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t('discover.advancedFilters.button')}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
