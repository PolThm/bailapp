import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
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
import { useChoreographies } from '@/context/ChoreographiesContext';
import type { ChoreographyMovement } from '@/types';
import { GripVertical } from 'lucide-react';

// Sortable wrapper component
function SortableMovementItem({
  movement,
  isEditing,
  choreography,
  onStartEdit,
  onEndEdit,
  onDelete,
  onDuplicate,
}: {
  movement: ChoreographyMovement;
  isEditing: boolean;
  choreography: { danceStyle: import('@/types').DanceStyle };
  onStartEdit: () => void;
  onEndEdit: (name: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movement.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`py-1.5 px-2 rounded-lg border bg-background hover:bg-muted ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none select-none"
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
          />
        </div>
      </div>
    </div>
  );
}

export function ChoreographyDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getChoreography, deleteChoreography, updateChoreography } = useChoreographies();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const choreography = id ? getChoreography(id) : undefined;

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
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
      <div className="pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="h-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all touch-manipulation"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold leading-tight line-clamp-2 flex-1">{choreography.name}</h1>
          <button
            onClick={() => setShowEditModal(true)}
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all touch-manipulation"
            aria-label={t('choreographies.edit.title')}
          >
            <Pencil className="h-4 w-4" />
          </button>
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
      {sortedMovements.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={movementIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 mb-6">
              {sortedMovements.map((movement) => (
                <SortableMovementItem
                  key={movement.id}
                  movement={movement}
                  choreography={choreography}
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
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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
    </>
  );
}
