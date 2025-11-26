import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Trash2, Copy, Palette, Clipboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import type { ChoreographyMovement } from '@/types';
import { changeMovementColor } from '@/hooks/useMovementColor';

import type { DanceStyle } from '@/types';
import movementList from '@/data/movementList.json';

interface ChoreographyMovementItemProps {
  movement: ChoreographyMovement;
  isDragging?: boolean;
  isEditing: boolean;
  danceStyle?: DanceStyle;
  onStartEdit: () => void;
  onEndEdit: (name: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy?: () => void;
  onColorChange?: () => void;
  isReadOnly?: boolean;
}

export function ChoreographyMovementItem({
  movement,
  isDragging = false,
  isEditing,
  danceStyle,
  onStartEdit,
  onEndEdit,
  onDelete,
  onDuplicate,
  onCopy,
  onColorChange,
  isReadOnly = false,
}: ChoreographyMovementItemProps) {
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editName, setEditName] = useState(movement.name);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditName(movement.name);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [movement.name, isEditing]);

  // Load and filter suggestions based on danceStyle and input
  useEffect(() => {
    if (!isEditing || !danceStyle || !editName.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Capitalize first letter to match JSON keys
    const styleKey = danceStyle.charAt(0).toUpperCase() + danceStyle.slice(1) as 'Salsa' | 'Bachata';
    const movements = movementList[styleKey] || [];
    
    const searchTerm = editName.trim().toLowerCase();
    const filtered = movements
      .filter(move => {
        const moveLower = move.toLowerCase();
        return moveLower.includes(searchTerm) && moveLower !== searchTerm;
      });
    
    if (filtered.length > 0) {
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [editName, danceStyle, isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showMenu || showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu, showSuggestions]);

  const handleNameClick = () => {
    if (!isEditing && !isReadOnly) {
      onStartEdit();
    }
  };

  const handleNameBlur = () => {
    if (isEditing && !isSelectingSuggestion) {
      const trimmedName = editName.trim();
      if (trimmedName) {
        onEndEdit(trimmedName);
      } else {
        // If empty, revert to original
        setEditName(movement.name);
        onEndEdit(movement.name);
      }
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showSuggestions && selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Select suggestion
        const selectedSuggestion = suggestions[selectedIndex];
        setIsSelectingSuggestion(true);
        setEditName(selectedSuggestion);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        // Use setTimeout to ensure the blur event doesn't interfere
        setTimeout(() => {
          onEndEdit(selectedSuggestion);
          setIsSelectingSuggestion(false);
        }, 0);
      } else {
        handleNameBlur();
      }
    } else if (e.key === 'Escape') {
      setEditName(movement.name);
      setShowSuggestions(false);
      onEndEdit(movement.name);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setIsSelectingSuggestion(true);
    setEditName(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Call onEndEdit directly with the suggestion
    onEndEdit(suggestion);
    setIsSelectingSuggestion(false);
  };

  const handleSuggestionMouseDown = (e: React.MouseEvent, suggestion: string) => {
    // Prevent blur event by using mousedown instead of click
    e.preventDefault();
    handleSuggestionClick(suggestion);
  };

  const handleDelete = () => {
    setShowDeleteModal(false);
    setShowMenu(false);
    onDelete();
  };

  const handleDuplicate = () => {
    setShowMenu(false);
    onDuplicate();
  };

  const handleCopy = () => {
    setShowMenu(false);
    if (onCopy) {
      onCopy();
    }
  };

  const handleChangeColor = async () => {
    setShowMenu(false);
    try {
      await changeMovementColor(movement.id);
      // Notify parent to force re-render
      if (onColorChange) {
        onColorChange();
      } else {
        // Fallback: reload if no callback provided
        window.location.reload();
      }
    } catch (error) {
      console.error('Error changing color:', error);
    }
  };

  return (
    <>
      <div
        className={`flex items-center gap-3 ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        {/* Name (editable on click) */}
        {isEditing ? (
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={(e) => {
                // Only handle blur if we're not selecting a suggestion
                // and the blur is not going to the suggestions dropdown
                if (!isSelectingSuggestion) {
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (!suggestionsRef.current?.contains(relatedTarget)) {
                    handleNameBlur();
                  }
                }
              }}
              onKeyDown={handleNameKeyDown}
              placeholder={t('choreographies.movements.namePlaceholder')}
              className="w-full"
            />
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-20 max-h-48 overflow-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(e) => handleSuggestionMouseDown(e, suggestion)}
                    className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={handleNameClick}
            className={`flex-1 rounded px-2 py-1 -mx-2 -my-1 min-h-[32px] flex items-start ${
              isReadOnly ? '' : 'cursor-text hover:bg-muted/50'
            }`}
          >
            {movement.name ? (
              <span className="line-clamp-5 break-words">
                {movement.name}
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center">
                {t('choreographies.movements.namePlaceholder')}
              </span>
            )}
          </div>
        )}

        {/* Menu Button */}
        {!isReadOnly && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
              aria-label={t('choreographies.movements.menu')}
            >
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </button>

          {/* Menu Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg z-10 min-w-[160px]">
              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <Copy className="h-4 w-4" />
                {t('choreographies.movements.duplicate')}
              </button>
              {onCopy && (
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
                >
                  <Clipboard className="h-4 w-4" />
                  {t('choreographies.movements.copy')}
                </button>
              )}
              <button
                onClick={handleChangeColor}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <Palette className="h-4 w-4" />
                {t('choreographies.movements.changeColor')}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive transition-colors text-left"
              >
                <Trash2 className="h-4 w-4" />
                {t('choreographies.movements.delete')}
              </button>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('choreographies.movements.deleteTitle')}
        message={t('choreographies.movements.deleteMessage')}
        confirmLabel={t('choreographies.movements.deleteConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        destructive={true}
      />
    </>
  );
}
