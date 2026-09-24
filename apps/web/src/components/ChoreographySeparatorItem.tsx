import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Trash2, Clock, Copy, Clipboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChoreographyMovement } from '@/types';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { PhrasesCountBadge, PhrasesCountModal } from '@/components/PhrasesCount';
import { Input } from '@/components/ui/input';

interface ChoreographySeparatorItemProps {
  separator: ChoreographyMovement;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: (name: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy?: () => void;
  onPhrasesCountChange?: (phrasesCount: number | undefined) => void;
  isReadOnly?: boolean;
}

export function ChoreographySeparatorItem({
  separator,
  isEditing,
  onStartEdit,
  onEndEdit,
  onDelete,
  onDuplicate,
  onCopy,
  onPhrasesCountChange,
  isReadOnly = false,
}: ChoreographySeparatorItemProps) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPhrasesModal, setShowPhrasesModal] = useState(false);
  const [editName, setEditName] = useState(separator.name);
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
      setEditName(separator.name);
    }
  }, [separator.name, isEditing]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEndEdit(editName.trim());
    } else if (e.key === 'Escape') {
      setEditName(separator.name);
      onEndEdit(separator.name);
    }
  };

  const handleRename = () => {
    setShowMenu(false);
    onStartEdit();
  };

  const handleDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => onEndEdit(editName.trim())}
            onKeyDown={handleKeyDown}
            placeholder={t('choreographies.movements.separatorPlaceholder')}
            className="flex-1"
          />
        ) : (
          <div className="flex min-h-[32px] flex-1 items-center gap-3">
            <span className="break-words text-sm font-semibold text-muted-foreground">
              {separator.name}
            </span>
            {separator.phrasesCount !== undefined && (
              <PhrasesCountBadge count={separator.phrasesCount} />
            )}
            <div className="h-px flex-1 bg-border" />
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
                    onClick={() => {
                      setShowMenu(false);
                      onCopy();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <Clipboard className="h-4 w-4" />
                    {t('choreographies.movements.copy')}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <Copy className="h-4 w-4" />
                  {t('choreographies.movements.duplicate')}
                </button>
                <button
                  onClick={handleRename}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                  {t('choreographies.movements.rename')}
                </button>
                {onPhrasesCountChange && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowPhrasesModal(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <Clock className="h-4 w-4" />
                    {t('choreographies.movements.phrasesCount')}
                  </button>
                )}
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

      {onPhrasesCountChange && (
        <PhrasesCountModal
          open={showPhrasesModal}
          onClose={() => setShowPhrasesModal(false)}
          value={separator.phrasesCount}
          onSave={onPhrasesCountChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('choreographies.movements.deleteSeparatorTitle')}
        message={t('choreographies.movements.deleteSeparatorMessage')}
        confirmLabel={t('choreographies.movements.deleteConfirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        destructive={true}
      />
    </>
  );
}
