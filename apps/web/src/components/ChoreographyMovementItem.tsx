import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Trash2, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import type { ChoreographyMovement } from '@/types';

interface ChoreographyMovementItemProps {
  movement: ChoreographyMovement;
  isDragging?: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: (name: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function ChoreographyMovementItem({
  movement,
  isDragging = false,
  isEditing,
  onStartEdit,
  onEndEdit,
  onDelete,
  onDuplicate,
}: ChoreographyMovementItemProps) {
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editName, setEditName] = useState(movement.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setEditName(movement.name);
    }
  }, [movement.name, isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleNameClick = () => {
    if (!isEditing) {
      onStartEdit();
    }
  };

  const handleNameBlur = () => {
    if (isEditing) {
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
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setEditName(movement.name);
      onEndEdit(movement.name);
    }
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

  return (
    <>
      <div
        className={`flex items-center gap-2 ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        {/* Name (editable on click) */}
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            placeholder={t('choreographies.movements.namePlaceholder')}
            className="flex-1"
          />
        ) : (
          <div
            onClick={handleNameClick}
            className="flex-1 cursor-text hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 min-h-[32px] flex items-start"
          >
            {movement.name ? (
              <span className="line-clamp-2 break-words">
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
            <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg z-10 min-w-[150px]">
              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <Copy className="h-4 w-4" />
                {t('choreographies.movements.duplicate')}
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
