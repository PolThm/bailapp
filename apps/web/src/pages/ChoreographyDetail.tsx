import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, createRef } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DanceStyleBadge,
  DanceSubStyleBadge,
  ComplexityBadge,
} from '@/components/ui/badge';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ChoreographyMovementItem } from '@/components/ChoreographyMovementItem';
import { useChoreographies } from '@/context/ChoreographiesContext';
import type { ChoreographyMovement } from '@/types';

export function ChoreographyDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getChoreography, deleteChoreography, updateChoreography } = useChoreographies();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartIndex, setTouchStartIndex] = useState<number | null>(null);
  const dragHandleRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const choreography = id ? getChoreography(id) : undefined;

  // Initialize drag handle refs
  useEffect(() => {
    if (choreography) {
      choreography.movements.forEach((movement) => {
        if (!dragHandleRefs.current[movement.id]) {
          dragHandleRefs.current[movement.id] = createRef<HTMLDivElement>();
        }
      });
    }
  }, [choreography]);

  if (!choreography) {
    return (
      <div className="flex flex-col items-center justify-center flex-1">
        <p className="text-lg text-muted-foreground">
          {t('choreographies.detail.notFound')}
        </p>
        <Button onClick={() => navigate('/choreographies')} className="mt-4">
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteChoreography(choreography.id);
    navigate('/choreographies');
  };

  const handleAddMovement = () => {
    const newMovement: ChoreographyMovement = {
      id: crypto.randomUUID(),
      name: '',
      order: choreography.movements.length,
    };
    const updatedMovements = [...choreography.movements, newMovement];
    updateChoreography(choreography.id, { movements: updatedMovements });
    setEditingId(newMovement.id);
    
    // Initialize drag handle ref
    dragHandleRefs.current[newMovement.id] = createRef<HTMLDivElement>();
  };

  const handleUpdateMovementName = (movementId: string, name: string) => {
    const updatedMovements = choreography.movements.map((m) =>
      m.id === movementId ? { ...m, name } : m
    );
    updateChoreography(choreography.id, { movements: updatedMovements });
    setEditingId(null);
  };

  const handleDeleteMovement = (movementId: string) => {
    const updatedMovements = choreography.movements
      .filter((m) => m.id !== movementId)
      .map((m, index) => ({ ...m, order: index }));
    updateChoreography(choreography.id, { movements: updatedMovements });
    delete dragHandleRefs.current[movementId];
  };

  const handleDuplicateMovement = (movementId: string) => {
    const movement = choreography.movements.find((m) => m.id === movementId);
    if (movement) {
      const newMovement: ChoreographyMovement = {
        id: crypto.randomUUID(),
        name: movement.name,
        order: movement.order + 1,
      };
      const updatedMovements = [
        ...choreography.movements.slice(0, movement.order + 1),
        newMovement,
        ...choreography.movements.slice(movement.order + 1).map((m) => ({
          ...m,
          order: m.order + 1,
        })),
      ];
      updateChoreography(choreography.id, { movements: updatedMovements });
      
      // Initialize drag handle ref
      dragHandleRefs.current[newMovement.id] = createRef<HTMLDivElement>();
    }
  };

  const handleDragStart = (e: React.DragEvent, movementId: string) => {
    setDraggedId(movementId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', movementId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetMovementId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetMovementId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = choreography.movements.findIndex((m) => m.id === draggedId);
    const targetIndex = choreography.movements.findIndex((m) => m.id === targetMovementId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    const newMovements = [...choreography.movements];
    const [removed] = newMovements.splice(draggedIndex, 1);
    newMovements.splice(targetIndex, 0, removed);

    // Update order
    const updatedMovements = newMovements.map((m, index) => ({
      ...m,
      order: index,
    }));

    updateChoreography(choreography.id, { movements: updatedMovements });
    setDraggedId(null);
  };

  const handleTouchStart = (e: React.TouchEvent, movementId: string) => {
    // Only handle if touching the drag handle area
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest('[data-drag-handle]') || 
                        target.closest('.cursor-grab') ||
                        dragHandleRefs.current[movementId]?.current?.contains(target);
    
    if (!isDragHandle) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const sortedMovements = [...choreography.movements].sort((a, b) => a.order - b.order);
    const startIndex = sortedMovements.findIndex((m) => m.id === movementId);
    
    setDraggedId(movementId);
    setTouchStartY(touch.clientY);
    setTouchStartIndex(startIndex);
  };

  const handleTouchMove = (e: React.TouchEvent, movementId: string) => {
    if (draggedId !== movementId || touchStartY === null) return;
    
    e.preventDefault();
    const touch = e.touches[0];

    // Find element under touch point
    const touchY = touch.clientY;
    const sortedMovements = [...choreography.movements].sort((a, b) => a.order - b.order);
    
    let targetIndex = touchStartIndex ?? 0;
    
    // Check each item's position
    sortedMovements.forEach((m, index) => {
      const itemElement = itemRefs.current[m.id];
      if (itemElement) {
        const rect = itemElement.getBoundingClientRect();
        const itemCenterY = rect.top + rect.height / 2;
        
        if (touchY > itemCenterY && index > (touchStartIndex ?? 0)) {
          targetIndex = index;
        } else if (touchY < itemCenterY && index < (touchStartIndex ?? 0)) {
          targetIndex = index;
        }
      }
    });

    // Update order in real-time during drag
    if (targetIndex !== touchStartIndex && touchStartIndex !== null) {
      const newMovements = [...sortedMovements];
      const [removed] = newMovements.splice(touchStartIndex, 1);
      newMovements.splice(targetIndex, 0, removed);

      const updatedMovements = newMovements.map((m, index) => ({
        ...m,
        order: index,
      }));

      updateChoreography(choreography.id, { movements: updatedMovements });
      
      // Update indices after reordering
      const newDraggedIndex = updatedMovements.findIndex((m) => m.id === movementId);
      setTouchStartIndex(newDraggedIndex);
    }
  };

  const handleTouchEnd = (_e: React.TouchEvent, movementId: string) => {
    if (draggedId !== movementId) return;
    
    // Final reorder if needed
    const sortedMovements = [...choreography.movements].sort((a, b) => a.order - b.order);
    const finalMovements = sortedMovements.map((m, index) => ({
      ...m,
      order: index,
    }));
    
    updateChoreography(choreography.id, { movements: finalMovements });
    
    setDraggedId(null);
    setTouchStartY(null);
    setTouchStartIndex(null);
  };

  // Sort movements by order
  const sortedMovements = [...choreography.movements].sort((a, b) => a.order - b.order);

  return (
    <>
      {/* Header with back icon and title */}
      <div className="pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="h-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all touch-manipulation"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold leading-tight line-clamp-2">{choreography.name}</h1>
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
      {sortedMovements.length > 0 && <div className="space-y-2 mb-6">
        {sortedMovements.map((movement) => (
          <div
            key={movement.id}
            ref={(el) => {
              itemRefs.current[movement.id] = el;
            }}
          >
            <ChoreographyMovementItem
              movement={movement}
              isDragging={draggedId === movement.id}
              isEditing={editingId === movement.id}
              onStartEdit={() => setEditingId(movement.id)}
              onEndEdit={(name) => {
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
              onDelete={() => handleDeleteMovement(movement.id)}
              onDuplicate={() => handleDuplicateMovement(movement.id)}
              onDragStart={(e) => handleDragStart(e, movement.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, movement.id)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              dragHandleRef={dragHandleRefs.current[movement.id] || createRef<HTMLDivElement | null>()}
            />
          </div>
        ))}
      </div>}

      {/* Add Movement Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleAddMovement}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('choreographies.movements.add')}
        </Button>
      </div>

      {/* Delete Button at bottom */}
      <div className="mt-auto pt-8 pb-4">
        <Button
          variant="link"
          className="w-full underline"
          onClick={() => setShowDeleteModal(true)}
        >
          {t('choreographies.detail.delete')}
        </Button>
      </div>

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
    </>
  );
}
