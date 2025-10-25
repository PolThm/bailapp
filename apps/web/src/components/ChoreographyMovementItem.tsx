import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Copy, Palette, Clipboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ChoreographyMovement, MentionType, DanceStyle } from '@/types';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { MentionSuggestionsModal } from '@/components/MentionSuggestionsModal';
import { Input } from '@/components/ui/input';
import movementListEN from '@/data/movementLists/movementListEN.json';
import movementListES from '@/data/movementLists/movementListES.json';
import movementListFR from '@/data/movementLists/movementListFR.json';
import { changeMovementColor } from '@/hooks/useMovementColor';

interface ChoreographyMovementItemProps {
  movement: ChoreographyMovement;
  isDragging?: boolean;
  isEditing: boolean;
  danceStyle?: DanceStyle;
  onStartEdit: () => void;
  onEndEdit: (name: string, mentionId?: string, mentionType?: MentionType) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy?: () => void;
  onColorChange?: () => void;
  isReadOnly?: boolean;
  currentChoreographyId?: string; // ID of the current choreography to exclude from mentions
  ownerId?: string | null; // Owner ID of the current choreography (for shared choreographies)
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
  currentChoreographyId,
  ownerId,
}: ChoreographyMovementItemProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMentionModal, setShowMentionModal] = useState(false);
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

  // Ensure "@" is present when entering edit mode for items with links
  useEffect(() => {
    if (isEditing && movement.mentionId && movement.mentionType) {
      if (!movement.name.startsWith('@')) {
        setEditName(`@${movement.name}`);
      }
    }
  }, [isEditing, movement.mentionId, movement.mentionType, movement.name]);

  // Check if input starts with "@" to show mention modal
  useEffect(() => {
    if (isEditing && editName.trim().startsWith('@')) {
      setShowMentionModal(true);
      setShowSuggestions(false);
    } else {
      setShowMentionModal(false);
    }
  }, [editName, isEditing]);

  // Load and filter suggestions based on danceStyle and input (only if not starting with @)
  useEffect(() => {
    if (!isEditing || !danceStyle || !editName.trim() || editName.trim().startsWith('@')) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Capitalize first letter to match JSON keys
    const styleKey = (danceStyle.charAt(0).toUpperCase() + danceStyle.slice(1)) as
      | 'Salsa'
      | 'Bachata';

    // Select the appropriate movement list based on user's language
    const currentLanguage = i18n.language || 'en';
    const movementList =
      currentLanguage === 'fr'
        ? movementListFR
        : currentLanguage === 'es'
          ? movementListES
          : movementListEN;

    const movements = movementList[styleKey] || [];

    const searchTerm = editName.trim().toLowerCase();
    const filtered = movements.filter((move) => {
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
  }, [editName, danceStyle, isEditing, i18n.language]);

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
    if (isEditing && !isSelectingSuggestion && !showMentionModal) {
      const trimmedName = editName.trim();
      if (trimmedName) {
        // Preserve mention info if it exists
        onEndEdit(trimmedName, movement.mentionId, movement.mentionType);
      } else {
        // If empty, revert to original
        setEditName(movement.name);
        onEndEdit(movement.name, movement.mentionId, movement.mentionType);
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
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setIsSelectingSuggestion(true);
    setEditName(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Call onEndEdit directly with the suggestion, preserving mention info
    onEndEdit(suggestion, movement.mentionId, movement.mentionType);
    setIsSelectingSuggestion(false);
  };

  const handleMentionSelect = (
    mentionId: string,
    mentionType: MentionType,
    displayName: string
  ) => {
    // Update the name to show the mention
    const newName = `@${displayName}`;
    setEditName(newName);
    // Call onEndEdit with the mention info
    onEndEdit(newName, mentionId, mentionType);
    setShowMentionModal(false);
  };

  const handleMentionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (movement.mentionId && movement.mentionType) {
      if (movement.mentionType === 'choreography') {
        // If we're viewing a shared choreography, include ownerId in the URL
        // so the nested choreography can also be accessed
        const url = ownerId
          ? `/choreography/${movement.mentionId}?ownerId=${ownerId}`
          : `/choreography/${movement.mentionId}`;
        navigate(url);
      } else if (movement.mentionType === 'figure') {
        navigate(`/figure/${movement.mentionId}`);
      }
    }
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
      <div className={`flex items-center gap-3 ${isDragging ? 'opacity-50' : ''}`}>
        {/* Name (editable on click) */}
        {isEditing ? (
          <div className="relative flex-1">
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
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border bg-background shadow-lg"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(e) => handleSuggestionMouseDown(e, suggestion)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
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
            className={`-mx-2 -my-1 flex min-h-[32px] flex-1 items-start rounded px-2 py-1 ${
              isReadOnly ? '' : 'cursor-text hover:bg-muted/50'
            }`}
          >
            {movement.name ? (
              <span className="line-clamp-5 break-words">
                {movement.mentionId && movement.mentionType ? (
                  <span
                    onClick={handleMentionClick}
                    className="cursor-pointer text-primary hover:underline"
                  >
                    {movement.name.startsWith('@') ? movement.name : `@${movement.name}`}
                  </span>
                ) : (
                  movement.name
                )}
              </span>
            ) : (
              <span className="flex items-center text-muted-foreground">
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
              className="rounded-full p-1.5 transition-colors hover:bg-muted"
              aria-label={t('choreographies.movements.menu')}
            >
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Menu Dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border bg-background shadow-lg">
                {onCopy && (
                  <button
                    onClick={handleCopy}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <Clipboard className="h-4 w-4" />
                    {t('choreographies.movements.copy')}
                  </button>
                )}
                <button
                  onClick={handleDuplicate}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <Copy className="h-4 w-4" />
                  {t('choreographies.movements.duplicate')}
                </button>
                <button
                  onClick={handleChangeColor}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <Palette className="h-4 w-4" />
                  {t('choreographies.movements.changeColor')}
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-destructive transition-colors hover:bg-destructive/10"
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

      {/* Mention Suggestions Modal */}
      <MentionSuggestionsModal
        open={showMentionModal}
        onClose={() => {
          setShowMentionModal(false);
          // Remove @ from input if modal is closed without selection
          if (editName.trim().startsWith('@') && editName.trim().length === 1) {
            setEditName('');
          }
        }}
        onSelect={handleMentionSelect}
        searchQuery={editName.trim().startsWith('@') ? editName.trim().slice(1) : ''}
        currentChoreographyId={currentChoreographyId}
      />
    </>
  );
}
