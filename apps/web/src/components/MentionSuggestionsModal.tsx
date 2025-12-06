import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Music2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Choreography, Figure, MentionType } from '@/types';
import { Input } from '@/components/ui/input';
import { useChoreographies } from '@/context/ChoreographiesContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useFigures } from '@/hooks/useFigures';
import { isEmpty, sortByLastOpened } from '@/lib/utils';

interface MentionSuggestionsModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mentionId: string, mentionType: MentionType, displayName: string) => void;
  searchQuery?: string;
  currentChoreographyId?: string; // ID of the current choreography to exclude from the list
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
  currentChoreographyId,
}: MentionSuggestionsModalProps) {
  const { t } = useTranslation();
  const { choreographies } = useChoreographies();
  const { figures, shorts } = useFigures();
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
            inputRef.current.setSelectionRange(
              inputRef.current.value.length,
              inputRef.current.value.length
            );
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

    // 1. All user's choreographies (excluding current one)
    const sortedChoreographies = sortByLastOpened(choreographies);
    sortedChoreographies.forEach((choreography: Choreography) => {
      // Exclude the current choreography from the list
      if (currentChoreographyId && choreography.id === currentChoreographyId) {
        return;
      }
      items.push({
        id: choreography.id,
        type: 'choreography' as MentionType,
        name: choreography.name,
        displayName: choreography.name,
      });
    });

    // 2. Favorite figures (after a separator) - include both figures and shorts
    const allFigures = [...figures, ...shorts];
    const favoriteFigures = allFigures.filter((figure: Figure) => favorites.includes(figure.id));
    const sortedFavoriteFigures = sortByLastOpened(favoriteFigures);
    sortedFavoriteFigures.forEach((figure: Figure) => {
      items.push({
        id: figure.id,
        type: 'figure' as MentionType,
        name: figure.shortTitle,
        displayName: figure.shortTitle,
      });
    });

    // 3. Other figures (not in favorites) - include both figures and shorts
    const otherFigures = allFigures.filter((figure: Figure) => !favorites.includes(figure.id));
    otherFigures.forEach((figure: Figure) => {
      items.push({
        id: figure.id,
        type: 'figure' as MentionType,
        name: figure.shortTitle,
        displayName: figure.shortTitle,
      });
    });

    return items;
  }, [choreographies, figures, shorts, favorites, currentChoreographyId]);

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
    const groups: { type: 'choreography' | 'figure' | 'other-figures'; items: MentionItem[] }[] =
      [];

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
      <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed inset-0 z-[101] flex items-start justify-center p-4 pt-8"
        onClick={onClose}
      >
        <div
          className="flex max-h-[80vh] w-full max-w-md flex-col rounded-lg border bg-background shadow-lg"
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h2 className="p-4 text-lg font-semibold">
            {t('choreographies.movements.mentionTitle')}
          </h2>

          {/* Search Bar */}
          <div className="border-b px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
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
            {isEmpty(groupedItems) ? (
              <div className="p-8 text-center text-muted-foreground">
                {t('choreographies.movements.noMentionsFound')}
              </div>
            ) : (
              groupedItems.map((group, groupIndex) => (
                <div key={group.type}>
                  {/* Separator before favorite figures and other figures */}
                  {groupIndex > 0 && <div className="my-2 h-px bg-border" />}

                  {/* Group Header */}
                  {group.type === 'choreography' && (
                    <div className="px-4 pb-2 pt-4 text-xs font-semibold uppercase text-muted-foreground">
                      {t('choreographies.movements.mentionChoreographies')}
                    </div>
                  )}
                  {group.type === 'figure' && (
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      {t('choreographies.movements.mentionFavoriteFigures')}
                    </div>
                  )}
                  {group.type === 'other-figures' && (
                    <div className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                      {t('choreographies.movements.mentionOtherFigures')}
                    </div>
                  )}

                  {/* Items */}
                  {group.items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                    >
                      {item.type === 'choreography' ? (
                        <Music2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      ) : (
                        <Heart className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
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
