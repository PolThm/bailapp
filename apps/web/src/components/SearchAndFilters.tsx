import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, Image, ImageOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DanceStyle } from '@/types';
import type { AdvancedFilters } from '@/components/AdvancedFiltersModal';

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

  const activeFiltersCount = Object.values(advancedFilters).filter(value => value !== undefined).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input with Toggle Button */}
      <div className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('discover.search.placeholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        
        {/* Images Toggle Button */}
        <Button
          variant="outline"
          onClick={() => onShowImagesChange(!showImages)}
          className="h-11 w-11 p-0 flex items-center justify-center flex-shrink-0"
          aria-label={showImages ? 'Hide images' : 'Show images'}
          title={showImages ? 'Hide images' : 'Show images'}
        >
          {showImages ? (
            <Image className="h-4 w-4" />
          ) : (
            <ImageOff className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="flex flex-row gap-2">
        {/* Style Filter */}
        <Select value={selectedStyle} onValueChange={onStyleChange}>
          <SelectTrigger className="flex-1 h-11">
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
          className="h-11 flex items-center gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t('discover.advancedFilters.button')}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}

