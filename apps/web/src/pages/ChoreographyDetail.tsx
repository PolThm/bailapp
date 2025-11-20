import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Pencil, Music2, Share2, Copy, Menu, Trash2, FileQuestion } from 'lucide-react';
import { useMovementColor } from '@/hooks/useMovementColor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import {
  DanceStyleBadge,
  DanceSubStyleBadge,
  ComplexityBadge,
} from '@/components/ui/badge';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { NewChoreographyModal } from '@/components/NewChoreographyModal';
import { ChoreographyMovementItem } from '@/components/ChoreographyMovementItem';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { getPublicChoreography } from '@/lib/services/choreographyService';
import { EmptyState } from '@/components/EmptyState';
import { useChoreographies } from '@/context/ChoreographiesContext';
import type { ChoreographyMovement, Choreography } from '@/types';
import { GripVertical } from 'lucide-react';
import { Toast } from '@/components/Toast';
import { Loader } from '@/components/Loader';

// Sortable wrapper component
function SortableMovementItem({
  movement,
  isEditing,
  choreography,
  onStartEdit,
  onEndEdit,
  onDelete,
  onDuplicate,
  colorUpdateKey,
  onColorChange,
  isReadOnly,
}: {
  movement: ChoreographyMovement;
  isEditing: boolean;
  choreography: { danceStyle: import('@/types').DanceStyle };
  onStartEdit: () => void;
  onEndEdit: (name: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  colorUpdateKey: number;
  onColorChange: () => void;
  isReadOnly?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movement.id });
  const backgroundColor = useMovementColor(movement.id, colorUpdateKey);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.7 : 1,
  };

  // Convert HSL color to HSLA with 20% opacity
  const getBackgroundColorWithOpacity = (color: string): string => {
    if (color === 'transparent') return 'transparent';
    
    // Parse HSL color (format: hsl(hue, saturation%, lightness%))
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      const hue = parseInt(hslMatch[1]);
      const saturation = parseInt(hslMatch[2]);
      const lightness = parseInt(hslMatch[3]);
      return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.125)`;
    }
    
    // Fallback: if it's already in a different format, try to add opacity
    return color;
  };

  return (
    <div 
      ref={setNodeRef} 
      style={{
        transform: style.transform,
        transition: style.transition,
        opacity: style.opacity,
        backgroundColor: getBackgroundColorWithOpacity(backgroundColor),
      }}
      className={`py-1.5 px-2 rounded-lg border hover:bg-muted/50 transition-colors ${
        isDragging ? 'z-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none select-none rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Movement Item Content */}
        <div className="flex-1">
          <ChoreographyMovementItem
            movement={movement}
            isDragging={isDragging}
            isEditing={isEditing}
            danceStyle={choreography.danceStyle}
            onStartEdit={onStartEdit}
            onEndEdit={onEndEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onColorChange={onColorChange}
            isReadOnly={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}

export function ChoreographyDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get('ownerId');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getChoreography, deleteChoreography, updateChoreography, togglePublic, copyChoreography, isLoading } = useChoreographies();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [colorUpdateKey, setColorUpdateKey] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [publicChoreography, setPublicChoreography] = useState<Choreography | null>(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Determine if we're viewing someone else's public choreography
  const isViewingPublicChoreography = ownerId && ownerId !== user?.uid;
  
  // Get choreography from context (user's own choreographies) or from public
  const contextChoreography = id ? getChoreography(id) : undefined;
  const choreography = isViewingPublicChoreography ? publicChoreography : contextChoreography;
  const lastUpdatedIdRef = useRef<string | null>(null);

  // Load public choreography if viewing someone else's
  useEffect(() => {
    if (isViewingPublicChoreography && id && ownerId) {
      setIsLoadingPublic(true);
      getPublicChoreography(id, ownerId)
        .then((choreo) => {
          setPublicChoreography(choreo);
        })
        .catch((error) => {
          console.error('Error loading public choreography:', error);
          setPublicChoreography(null);
        })
        .finally(() => {
          setIsLoadingPublic(false);
        });
    } else {
      setPublicChoreography(null);
    }
  }, [id, ownerId, isViewingPublicChoreography]);

  // Update lastOpenedAt when choreography is opened (only once per id, and only for own choreographies)
  useEffect(() => {
    if (choreography && id && !isViewingPublicChoreography && lastUpdatedIdRef.current !== id) {
      const now = new Date().toISOString();
      updateChoreography(id, { lastOpenedAt: now });
      lastUpdatedIdRef.current = id;
    }
  }, [id, choreography, isViewingPublicChoreography, updateChoreography]);

  // Configure sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  // Show loader while loading public choreography or while context is loading (for private choreographies)
  if (isLoadingPublic || (!isViewingPublicChoreography && isLoading && !choreography)) {
    return <Loader />;
  }

  if (!choreography) {
    return (
      <>
        <EmptyState
          icon={FileQuestion}
          title={t('choreographies.detail.notFound')}
          description={t('choreographies.detail.notFoundDescription')}
          actionLabel={t('choreographies.detail.backToChoreographies')}
          onAction={() => navigate('/choreographies')}
          isAuthenticated={!!user}
          onLogin={() => setShowAuthModal(true)}
        />
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  // Check if user owns this choreography
  // If it's not a public choreography from another user, and user is authenticated, they own it
  // (choreographies from context are always owned by the user)
  const isOwner = !isViewingPublicChoreography && !!user && (user.uid === choreography.ownerId || !choreography.ownerId || contextChoreography !== undefined);

  const handleDelete = () => {
    if (isOwner) {
      deleteChoreography(choreography.id);
      navigate('/choreographies');
    }
  };

  const handleAddMovement = () => {
    if (!isOwner) return;
    const newMovement: ChoreographyMovement = {
      id: crypto.randomUUID(),
      name: '',
      order: choreography.movements.length,
    };
    const updatedMovements = [...choreography.movements, newMovement];
    updateChoreography(choreography.id, { movements: updatedMovements });
    setEditingId(newMovement.id);
  };

  const handleUpdateMovementName = (movementId: string, name: string) => {
    if (!isOwner) return;
    const updatedMovements = choreography.movements.map((m: ChoreographyMovement) =>
      m.id === movementId ? { ...m, name } : m
    );
    updateChoreography(choreography.id, { movements: updatedMovements });
    setEditingId(null);
  };

  const handleDeleteMovement = (movementId: string) => {
    if (!isOwner) return;
    const updatedMovements = choreography.movements
      .filter((m: ChoreographyMovement) => m.id !== movementId)
      .map((m: ChoreographyMovement, index: number) => ({ ...m, order: index }));
    updateChoreography(choreography.id, { movements: updatedMovements });
  };

  const handleDuplicateMovement = (movementId: string) => {
    if (!isOwner) return;
    const movement = choreography.movements.find((m: ChoreographyMovement) => m.id === movementId);
    if (movement) {
      const newMovement: ChoreographyMovement = {
        id: crypto.randomUUID(),
        name: movement.name,
        order: movement.order + 1,
      };
      const updatedMovements = [
        ...choreography.movements.slice(0, movement.order + 1),
        newMovement,
        ...choreography.movements.slice(movement.order + 1).map((m: ChoreographyMovement) => ({
          ...m,
          order: m.order + 1,
        })),
      ];
      updateChoreography(choreography.id, { movements: updatedMovements });
    }
  };

  const handleColorChange = () => {
    // Force re-render by updating the key
    setColorUpdateKey(prev => prev + 1);
  };

  const handleShare = async () => {
    // First, make the choreography public if it's not already
    if (!choreography.isPublic) {
      togglePublic(choreography.id);
    }

    const shareUrl = `${window.location.origin}/choreography/${choreography.id}?ownerId=${choreography.ownerId || user?.uid}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: choreography.name,
          text: t('choreographies.share.shareText', {
            name: choreography.name,
            style: t(`badges.danceStyle.${choreography.danceStyle}`)
          }),
          url: shareUrl,
        });
        setToast({ message: t('choreographies.share.shared'), type: 'success' });
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      setToast({ message: t('choreographies.share.linkCopied'), type: 'success' });
    }
    setShowMenu(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isOwner) return;
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const sortedMovements = [...choreography.movements].sort((a, b) => a.order - b.order);
    const oldIndex = sortedMovements.findIndex((m) => m.id === active.id);
    const newIndex = sortedMovements.findIndex((m) => m.id === over.id);

    const newMovements = arrayMove(sortedMovements, oldIndex, newIndex);
    
    // Update order
    const updatedMovements = newMovements.map((m, index) => ({
      ...m,
      order: index,
    }));

    updateChoreography(choreography.id, { movements: updatedMovements });
  };

  // Sort movements by order
  const sortedMovements = [...choreography.movements].sort((a, b) => a.order - b.order);
  const movementIds = sortedMovements.map((m) => m.id);

  return (
    <>
      {/* Header with back icon and title */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="h-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all touch-manipulation"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold leading-tight line-clamp-2 flex-1">{choreography.name}</h1>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all touch-manipulation"
                aria-label={t('choreographies.menu.title')}
              >
                <Menu className="h-4 w-4" />
              </button>
              {showMenu && (
                <>
                  {/* Overlay to close menu on click outside */}
                  <div
                    className="fixed inset-0 z-[50]"
                    onClick={() => setShowMenu(false)}
                  />
                  {/* Menu dropdown */}
                  <div className="absolute right-0 top-full mt-2 rounded-md border bg-popover shadow-lg z-[60] py-1">
                    <button
                      onClick={() => {
                        setShowEditModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-3"
                    >
                      <Pencil className="h-4 w-4" />
                      {t('choreographies.detail.edit')}
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-3"
                    >
                      <Share2 className="h-4 w-4" />
                      {t('choreographies.detail.share')}
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-accent text-destructive flex items-center gap-3"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('choreographies.detail.delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <DanceStyleBadge style={choreography.danceStyle} />
          {choreography.danceSubStyle && (
            <DanceSubStyleBadge
              style={choreography.danceStyle}
              subStyle={choreography.danceSubStyle}
            />
          )}
          {choreography.complexity && (
            <ComplexityBadge complexity={choreography.complexity} />
          )}
        </div>
      </div>

      {/* Movements List */}
      {sortedMovements.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={movementIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 my-6">
              {sortedMovements.map((movement) => (
                <SortableMovementItem
                  key={`${movement.id}-${colorUpdateKey}`}
                  movement={movement}
                  choreography={choreography}
                  isEditing={editingId === movement.id}
                  onStartEdit={() => isOwner && setEditingId(movement.id)}
                  onEndEdit={(name) => {
                    if (!isOwner) return;
                    if (!name.trim()) {
                      // If empty name and it's a new movement (no name originally), delete it
                      if (!movement.name) {
                        handleDeleteMovement(movement.id);
                      } else {
                        // Keep original name if editing existing
                        handleUpdateMovementName(movement.id, movement.name);
                      }
                    } else {
                      handleUpdateMovementName(movement.id, name);
                    }
                  }}
                  onDelete={() => isOwner && handleDeleteMovement(movement.id)}
                  onDuplicate={() => isOwner && handleDuplicateMovement(movement.id)}
                  colorUpdateKey={colorUpdateKey}
                  onColorChange={isOwner ? handleColorChange : () => {}}
                  isReadOnly={!isOwner}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <EmptyState
          icon={Music2}
          title={t('choreographies.movements.empty.title')}
          description={t('choreographies.movements.empty.description')}
          actionLabel={t('choreographies.movements.add')}
          onAction={handleAddMovement}
        />
      )}

      <div className="flex flex-col gap-2 mt-auto">
        {isOwner && sortedMovements.length > 0 && (
          <Button
              variant="default"
              onClick={handleAddMovement}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('choreographies.movements.add')}
            </Button>
          )}
          {isViewingPublicChoreography && choreography && (
            <Button
              variant="outline"
              className="w-full mt-2"
              size="lg"
              onClick={async () => {
                try {
                  await copyChoreography(choreography);
                  // Navigate to choreographies list, replacing current history entry
                  // so back button goes to the list, not the shared choreography
                  navigate('/choreographies', { replace: true });
                } catch (error) {
                  console.error('Failed to copy choreography:', error);
                  // You could add an error toast here
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('choreographies.share.duplicateToMyChoreographies')}
            </Button>
          )}
      </div>

      {/* Edit Modal */}
      <NewChoreographyModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        choreography={choreography}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('choreographies.delete.title')}
        message={t('choreographies.delete.message')}
        confirmLabel={t('choreographies.delete.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        destructive={true}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
