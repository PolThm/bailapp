import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Music2, Heart } from 'lucide-react';
import { useChoreographies } from '@/context/ChoreographiesContext';
import { useFigures } from '@/context/FiguresContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Input } from '@/components/ui/input';
import type { Choreography, Figure, MentionType } from '@/types';
import { sortByLastOpened } from '@/lib/utils';

interface MentionSuggestionsModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mentionId: string, mentionType: MentionType, displayName: string) => void;
  searchQuery?: string;
}

interface MentionItem {
  id: string;
  type: MentionType;
  name: string;
  displayName: string;
}

export function MentionSuggestionsModal({
  open,
  onClose,
  onSelect,
  searchQuery: initialSearchQuery = '',
}: MentionSuggestionsModalProps) {
  const { t } = useTranslation();
  const { choreographies } = useChoreographies();
  const { figures } = useFigures();
  const { favorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync searchQuery with prop when it changes
  useEffect(() => {
    if (open) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery, open]);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Set cursor to end if there's already text
          if (inputRef.current.value) {
            inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
          }
        }
      }, 100);
    }
  }, [open]);

  // Reset search query when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  // Get all mentionable items
  const allItems = useMemo(() => {
    const items: MentionItem[] = [];

    // 1. All user's choreographies
    const sortedChoreographies = sortByLastOpened(choreographies);
    sortedChoreographies.forEach((choreography: Choreography) => {
      items.push({
        id: choreography.id,
        type: 'choreography' as MentionType,
        name: choreography.name,
        displayName: choreography.name,
      });
    });

    // 2. Favorite figures (after a separator)
    const favoriteFigures = figures.filter((figure: Figure) => favorites.includes(figure.id));
    const sortedFavoriteFigures = sortByLastOpened(favoriteFigures);
    sortedFavoriteFigures.forEach((figure: Figure) => {
      items.push({
        id: figure.id,
        type: 'figure' as MentionType,
        name: figure.shortTitle,
        displayName: figure.shortTitle,
      });
    });

    // 3. Other figures (not in favorites)
    const otherFigures = figures.filter((figure: Figure) => !favorites.includes(figure.id));
    otherFigures.forEach((figure: Figure) => {
      items.push({
        id: figure.id,
        type: 'figure' as MentionType,
        name: figure.shortTitle,
        displayName: figure.shortTitle,
      });
    });

    return items;
  }, [choreographies, figures, favorites]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return allItems;
    }

    const query = searchQuery.toLowerCase().trim();
    return allItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [allItems, searchQuery]);

  // Group items by type for display
  const groupedItems = useMemo(() => {
    const groups: { type: 'choreography' | 'figure' | 'other-figures'; items: MentionItem[] }[] = [];
    
    // Choreographies
    const choreographyItems = filteredItems.filter((item) => item.type === 'choreography');
    if (choreographyItems.length > 0) {
      groups.push({ type: 'choreography', items: choreographyItems });
    }

    // Favorite figures
    const favoriteFigureItems = filteredItems.filter(
      (item) => item.type === 'figure' && favorites.includes(item.id)
    );
    if (favoriteFigureItems.length > 0) {
      groups.push({ type: 'figure', items: favoriteFigureItems });
    }

    // Other figures
    const otherFigureItems = filteredItems.filter(
      (item) => item.type === 'figure' && !favorites.includes(item.id)
    );
    if (otherFigureItems.length > 0) {
      groups.push({ type: 'other-figures', items: otherFigureItems });
    }

    return groups;
  }, [filteredItems, favorites]);

  const handleSelect = (item: MentionItem) => {
    onSelect(item.id, item.type, item.displayName);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-background border rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col"
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h2 className="text-lg font-semibold p-4">
            {t('choreographies.movements.mentionTitle')}
          </h2>

          {/* Search Bar */}
          <div className="px-4 pb-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('choreographies.movements.mentionSearchPlaceholder')}
                className="pl-9"
              />
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-auto">
            {groupedItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {t('choreographies.movements.noMentionsFound')}
              </div>
            ) : (
              groupedItems.map((group, groupIndex) => (
                <div key={group.type}>
                  {/* Separator before favorite figures and other figures */}
                  {groupIndex > 0 && (
                    <div className="h-px bg-border my-2" />
                  )}
                  
                  {/* Group Header */}
                  {group.type === 'choreography' && (
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                      {t('choreographies.movements.mentionChoreographies')}
                    </div>
                  )}
                  {group.type === 'figure' && (
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                      <Heart className="h-3 w-3" />
                      {t('choreographies.movements.mentionFavoriteFigures')}
                    </div>
                  )}
                  {group.type === 'other-figures' && (
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                      {t('choreographies.movements.mentionOtherFigures')}
                    </div>
                  )}

                  {/* Items */}
                  {group.items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      {item.type === 'choreography' ? (
                        <Music2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="flex-1 truncate">{item.displayName}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

