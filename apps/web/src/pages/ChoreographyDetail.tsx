import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Music2, Share2, Copy, Menu, Trash2, FileQuestion, Clipboard, UserPlus, UserMinus, Eye, Users, Lock } from 'lucide-react';
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
import { HeaderBackTitle } from '@/components/HeaderBackTitle';
import { useAuth } from '@/context/AuthContext';
import type { User } from 'firebase/auth';
import { getPublicChoreography, getChoreographyByIdAndOwner } from '@/lib/services/choreographyService';
import { getUserProfileFromFirestore } from '@/lib/services/userService';
import { EmptyState } from '@/components/EmptyState';
import { useChoreographies } from '@/context/ChoreographiesContext';
import type { ChoreographyMovement, Choreography } from '@/types';
import { GripVertical } from 'lucide-react';
import { Toast } from '@/components/Toast';
import { Loader } from '@/components/Loader';
import { EXAMPLE_CHOREOGRAPHY_ID } from '@/data/mockChoreographies';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Sortable wrapper component
function SortableMovementItem({
  movement,
  isEditing,
  choreography,
  onStartEdit,
  onEndEdit,
  onDelete,
  onDuplicate,
  onCopy,
  colorUpdateKey,
  onColorChange,
  isReadOnly,
  currentChoreographyId,
}: {
  movement: ChoreographyMovement;
  isEditing: boolean;
  choreography: { danceStyle: import('@/types').DanceStyle };
  onStartEdit: () => void;
  onEndEdit: (name: string, mentionId?: string, mentionType?: import('@/types').MentionType) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy?: () => void;
  colorUpdateKey: number;
  onColorChange: () => void;
  isReadOnly?: boolean;
  currentChoreographyId?: string;
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
            onCopy={onCopy}
            onColorChange={onColorChange}
            isReadOnly={isReadOnly}
            currentChoreographyId={currentChoreographyId}
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getChoreography, deleteChoreography, updateChoreography, togglePublic, copyChoreography, followChoreography, unfollowChoreography, updateSharingMode, isLoading } = useChoreographies();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [colorUpdateKey, setColorUpdateKey] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [publicChoreography, setPublicChoreography] = useState<Choreography | null>(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [copiedMovement, setCopiedMovement] = useState<{ movement: ChoreographyMovement; sourceChoreographyId: string } | null>(null);
  const [showSharingModeMenu, setShowSharingModeMenu] = useState(false);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [isPrivateFollowedChoreography, setIsPrivateFollowedChoreography] = useState(false);
  const [privateChoreography, setPrivateChoreography] = useState<Choreography | null>(null);
  const [showChoreographyInfoModal, setShowChoreographyInfoModal] = useState(false);

  // Close sharing mode submenu when main menu closes
  useEffect(() => {
    if (!showMenu) {
      setShowSharingModeMenu(false);
    }
  }, [showMenu]);

  // Determine if we're viewing someone else's public choreography
  const isViewingPublicChoreography = ownerId && ownerId !== user?.uid;
  
  // Get choreography from context (user's own choreographies) or from public
  const contextChoreography = id ? getChoreography(id) : undefined;
  const choreography = isViewingPublicChoreography ? publicChoreography : contextChoreography;
  const lastUpdatedIdRef = useRef<string | null>(null);
  const previousUserRef = useRef<User | null>(user);

  // Load copied movement from localStorage on mount and when choreography changes
  useEffect(() => {
    const stored = localStorage.getItem('copiedMovement');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCopiedMovement(parsed);
      } catch (error) {
        console.error('Error parsing copied movement:', error);
        localStorage.removeItem('copiedMovement');
      }
    }
  }, [id]);

  // Auto-remove copied movement after 1 minute if not pasted
  useEffect(() => {
    if (!copiedMovement) return;

    const timer = setTimeout(() => {
      localStorage.removeItem('copiedMovement');
      setCopiedMovement(null);
    }, 60000); // 1 minute

    return () => {
      clearTimeout(timer);
    };
  }, [copiedMovement]);

  // Load public choreography if viewing someone else's
  useEffect(() => {
    // Check if we have ownerId in URL (shared choreography)
    // Even if user is not authenticated, we should try to load it if ownerId exists
    if (ownerId && id && ownerId !== user?.uid) {
      setIsLoadingPublic(true);
      setIsPrivateFollowedChoreography(false);
      
      // Load owner name first (always needed)
      getUserProfileFromFirestore(ownerId)
        .then((profile) => {
          setOwnerName(profile?.displayName || profile?.email || ownerId);
        })
        .catch((error) => {
          console.error('Error loading owner profile:', error);
          setOwnerName(ownerId);
        });
      
      // First try to get it as public
      getPublicChoreography(id, ownerId)
        .then((choreo) => {
          if (choreo) {
            setPublicChoreography(choreo);
            setIsPrivateFollowedChoreography(false);
          } else {
            // If not public, check if it exists and is private, and if user is following it
            if (user?.uid) {
              getChoreographyByIdAndOwner(id, ownerId)
                .then((choreo) => {
                  if (choreo && !choreo.isPublic && choreo.followedBy?.includes(user.uid)) {
                    // User is following this choreography but it's now private
                    setIsPrivateFollowedChoreography(true);
                    setPrivateChoreography(choreo);
                    setPublicChoreography(null);
                  } else {
                    setPublicChoreography(null);
                    setIsPrivateFollowedChoreography(false);
                    setPrivateChoreography(null);
                  }
                })
                .catch((error) => {
                  console.error('Error checking private choreography:', error);
                  setPublicChoreography(null);
                  setIsPrivateFollowedChoreography(false);
                });
            } else {
              setPublicChoreography(null);
              setIsPrivateFollowedChoreography(false);
            }
          }
        })
        .catch((error) => {
          console.error('Error loading public choreography:', error);
          setPublicChoreography(null);
          setIsPrivateFollowedChoreography(false);
        })
        .finally(() => {
          setIsLoadingPublic(false);
        });
    } else {
      setPublicChoreography(null);
      setOwnerName(null);
      setIsPrivateFollowedChoreography(false);
      setPrivateChoreography(null);
    }
  }, [id, ownerId, user]);

  // Redirect after sign in
  useEffect(() => {
    // Check if user just signed in (was null, now is not null)
    const justSignedIn = !previousUserRef.current && user;
    
    if (justSignedIn) {
      if (id === EXAMPLE_CHOREOGRAPHY_ID) {
        // User just signed in while viewing example choreography
        // Redirect to choreographies list to avoid "not found" error
        navigate('/choreographies', { replace: true });
      }
      // For shared choreographies, the useEffect above will automatically reload
      // the choreography when user changes, so no need to do anything here
    }
    
    // Update previous user ref
    previousUserRef.current = user;
  }, [id, user, navigate]);

  // Update lastOpenedAt when choreography is opened (only once per id, and only for own choreographies)
  // Skip for example choreography if user is not authenticated
  useEffect(() => {
    if (choreography && id && !isViewingPublicChoreography && lastUpdatedIdRef.current !== id && user) {
      const isExampleChoreography = choreography.id === EXAMPLE_CHOREOGRAPHY_ID;
      // Don't update lastOpenedAt for example choreography if user is not authenticated
      // (but if user is authenticated and owns it, update it)
      if (!isExampleChoreography || (isExampleChoreography && user)) {
        const now = new Date().toISOString();
        updateChoreography(id, { lastOpenedAt: now }, choreography?.ownerId);
        lastUpdatedIdRef.current = id;
      }
    }
  }, [id, choreography, isViewingPublicChoreography, updateChoreography, user]);

  // Check if user is following this choreography (computed directly, no state to avoid flicker)
  const isFollowing = choreography && user 
    ? (choreography.followedBy?.includes(user.uid) || false)
    : false;

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

  const handleRemoveFromList = async () => {
    if (!user || !id || !ownerId) return;
    
    try {
      await unfollowChoreography(id, ownerId);
      setToast({ message: t('choreographies.share.unfollowSuccess'), type: 'success' });
      navigate('/choreographies');
    } catch (error) {
      console.error('Failed to remove choreography from list:', error);
      setToast({ message: t('common.error'), type: 'error' });
    }
  };

  // Show loader while loading public choreography or while context is loading (for private choreographies)
  if (isLoadingPublic || (!isViewingPublicChoreography && isLoading && !choreography)) {
    return <Loader />;
  }

  // Show message if choreography is private and user is following it
  if (isPrivateFollowedChoreography) {
    return (
      <>
        <HeaderBackTitle title={privateChoreography?.name || t('choreographies.title')} />
        <EmptyState
          icon={Lock}
          title={t('choreographies.share.private.title')}
          description={t('choreographies.share.private.description')}
          actionLabel={t('choreographies.detail.backToChoreographies')}
          onAction={() => navigate('/choreographies')}
          secondaryActionLabel={t('choreographies.share.private.removeFromList')}
          onSecondaryAction={handleRemoveFromList}
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

  if (!choreography) {
    // If ownerId is present, it's a shared choreography - prioritize sign in
    const isSharedChoreography = !!ownerId;
    
    return (
      <>
        <EmptyState
          icon={FileQuestion}
          title={t('choreographies.detail.notFound')}
          description={t('choreographies.detail.notFoundDescription')}
          actionLabel={isSharedChoreography && !user ? t('profile.signIn') : t('choreographies.detail.backToChoreographies')}
          onAction={isSharedChoreography && !user ? () => setShowAuthModal(true) : () => navigate('/choreographies')}
          secondaryActionLabel={isSharedChoreography && !user ? t('choreographies.detail.backToChoreographies') : undefined}
          onSecondaryAction={isSharedChoreography && !user ? () => navigate('/choreographies') : undefined}
          isAuthenticated={!!user}
          onLogin={isSharedChoreography ? undefined : () => setShowAuthModal(true)}
        />
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  // Check if user owns this choreography
  // If it's not a public choreography from another user, and user is authenticated, they own it
  // (choreographies from context are always owned by the user)
  // Exception: example choreography is read-only for non-authenticated users
  const isExampleChoreography = choreography.id === EXAMPLE_CHOREOGRAPHY_ID;
  const isOwner = !isViewingPublicChoreography && !!user && (user.uid === choreography.ownerId || !choreography.ownerId || contextChoreography !== undefined) && !(isExampleChoreography && !user);
  
  // Check if user can edit (owner or collaborative follower)
  const canEdit = isOwner || (
    isViewingPublicChoreography && 
    user && 
    choreography.sharingMode === 'collaborative' && 
    isFollowing
  );

  // Check if we can paste (item is copied and user can edit the current choreography)
  const canPaste = copiedMovement && 
    canEdit && 
    choreography !== null;

  const handleDelete = () => {
    if (isOwner) {
      deleteChoreography(choreography.id);
      // Navigate back to choreographies list with toast message in state
      navigate('/choreographies', {
        state: {
          toast: {
            message: t('choreographies.delete.success'),
            type: 'success' as const,
          },
        },
      });
    }
  };

  const handleAddMovement = () => {
    // For example choreography, show auth modal if user is not authenticated
    if (isExampleChoreography && !user) {
      setShowAuthModal(true);
      return;
    }
    if (!canEdit) return;
    const newMovement: ChoreographyMovement = {
      id: crypto.randomUUID(),
      name: '',
      order: choreography.movements.length,
    };
    const updatedMovements = [...choreography.movements, newMovement];
    // Optimistic update for public choreography
    if (isViewingPublicChoreography && publicChoreography) {
      setPublicChoreography({
        ...publicChoreography,
        movements: updatedMovements,
      });
    }
    updateChoreography(choreography.id, { movements: updatedMovements }, choreography.ownerId);
    setEditingId(newMovement.id);
  };

  const handleUpdateMovementName = (movementId: string, name: string, mentionId?: string, mentionType?: import('@/types').MentionType) => {
    if (!canEdit) return;
    const updatedMovements = choreography.movements.map((m: ChoreographyMovement) =>
      m.id === movementId ? { ...m, name, mentionId, mentionType } : m
    );
    // Optimistic update for public choreography
    if (isViewingPublicChoreography && publicChoreography) {
      setPublicChoreography({
        ...publicChoreography,
        movements: updatedMovements,
      });
    }
    updateChoreography(choreography.id, { movements: updatedMovements }, choreography.ownerId);
    setEditingId(null);
  };

  const handleDeleteMovement = (movementId: string) => {
    if (!canEdit) return;
    const updatedMovements = choreography.movements
      .filter((m: ChoreographyMovement) => m.id !== movementId)
      .map((m: ChoreographyMovement, index: number) => ({ ...m, order: index }));
    // Optimistic update for public choreography
    if (isViewingPublicChoreography && publicChoreography) {
      setPublicChoreography({
        ...publicChoreography,
        movements: updatedMovements,
      });
    }
    updateChoreography(choreography.id, { movements: updatedMovements }, choreography.ownerId);
  };

  const handleDuplicateMovement = (movementId: string) => {
    if (!canEdit) return;
    const movement = choreography.movements.find((m: ChoreographyMovement) => m.id === movementId);
    if (movement) {
      const newMovement: ChoreographyMovement = {
        id: crypto.randomUUID(),
        name: movement.name,
        order: movement.order + 1,
        mentionId: movement.mentionId,
        mentionType: movement.mentionType,
      };
      const updatedMovements = [
        ...choreography.movements.slice(0, movement.order + 1),
        newMovement,
        ...choreography.movements.slice(movement.order + 1).map((m: ChoreographyMovement) => ({
          ...m,
          order: m.order + 1,
        })),
      ];
      // Optimistic update for public choreography
      if (isViewingPublicChoreography && publicChoreography) {
        setPublicChoreography({
          ...publicChoreography,
          movements: updatedMovements,
        });
      }
      updateChoreography(choreography.id, { movements: updatedMovements }, choreography.ownerId);
    }
  };

  const handleColorChange = () => {
    // Force re-render by updating the key
    setColorUpdateKey(prev => prev + 1);
  };

  const handleCopyMovement = (movement: ChoreographyMovement) => {
    if (!choreography) return;
    const copiedData = {
      movement: {
        ...movement,
        id: crypto.randomUUID(), // Generate new ID for the copied item
      },
      sourceChoreographyId: choreography.id,
    };
    localStorage.setItem('copiedMovement', JSON.stringify(copiedData));
    setCopiedMovement(copiedData);
    setToast({ message: t('choreographies.movements.copySuccess'), type: 'success' });
  };

  const handlePasteMovement = () => {
    if (!copiedMovement || !choreography || !canEdit) return;
    
    const newMovement: ChoreographyMovement = {
      ...copiedMovement.movement,
      id: crypto.randomUUID(), // Generate new ID
      order: choreography.movements.length,
    };
    
    const updatedMovements = [...choreography.movements, newMovement];
    // Optimistic update for public choreography
    if (isViewingPublicChoreography && publicChoreography) {
      setPublicChoreography({
        ...publicChoreography,
        movements: updatedMovements,
      });
    }
    updateChoreography(choreography.id, { movements: updatedMovements }, choreography.ownerId);
    
    // Clear the copied movement after pasting
    localStorage.removeItem('copiedMovement');
    setCopiedMovement(null);
    
    setToast({ message: t('choreographies.movements.pasteSuccess'), type: 'success' });
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

  const handleDuplicateChoreography = async () => {
    if (!choreography || !isOwner) return;
    
    try {
      // Create a copy with "Copie de ..." prefix
      const copyName = t('choreographies.detail.copyOf', { name: choreography.name });
      const copiedChoreography: Choreography = {
        ...choreography,
        name: copyName,
      };
      
      await copyChoreography(copiedChoreography);
      setShowMenu(false);
      
      // Navigate back to choreographies list with toast message in state
      navigate('/choreographies', {
        state: {
          toast: {
            message: t('choreographies.detail.duplicateSuccess'),
            type: 'success' as const,
          },
        },
      });
    } catch (error) {
      console.error('Failed to duplicate choreography:', error);
      setToast({ message: t('common.error'), type: 'error' });
    }
  };

  const handleFollow = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!choreography || !choreography.ownerId) return;
    
    // Optimistic update
    const previousFollowedBy = choreography.followedBy || [];
    if (publicChoreography && !previousFollowedBy.includes(user.uid)) {
      setPublicChoreography({
        ...publicChoreography,
        followedBy: [...previousFollowedBy, user.uid],
      });
    }
    
    try {
      await followChoreography(choreography.id, choreography.ownerId);
      setToast({ message: t('choreographies.share.followSuccess'), type: 'success' });
    } catch (error) {
      console.error('Failed to follow choreography:', error);
      // Revert on error
      if (publicChoreography) {
        setPublicChoreography({
          ...publicChoreography,
          followedBy: previousFollowedBy,
        });
      }
      setToast({ message: t('common.error'), type: 'error' });
    }
  };

  const handleUnfollow = async () => {
    if (!user || !choreography || !choreography.ownerId) return;
    
    // Optimistic update
    const previousFollowedBy = choreography.followedBy || [];
    if (publicChoreography && previousFollowedBy.includes(user.uid)) {
      setPublicChoreography({
        ...publicChoreography,
        followedBy: previousFollowedBy.filter((id) => id !== user.uid),
      });
    }
    
    try {
      await unfollowChoreography(choreography.id, choreography.ownerId);
      setToast({ message: t('choreographies.share.unfollowSuccess'), type: 'success' });
    } catch (error) {
      console.error('Failed to unfollow choreography:', error);
      // Revert on error
      if (publicChoreography) {
        setPublicChoreography({
          ...publicChoreography,
          followedBy: previousFollowedBy,
        });
      }
      setToast({ message: t('common.error'), type: 'error' });
    }
  };

  const handleChangeSharingMode = async (mode: 'view-only' | 'collaborative') => {
    if (!choreography || !isOwner) return;
    
    try {
      await updateSharingMode(choreography.id, mode);
      setShowSharingModeMenu(false);
      setShowMenu(false);
      setToast({ message: t('choreographies.share.sharingMode.updated'), type: 'success' });
    } catch (error) {
      console.error('Failed to update sharing mode:', error);
      setToast({ message: t('common.error'), type: 'error' });
    }
  };

  const handleMakePrivate = async () => {
    if (!choreography || !isOwner) return;
    
    try {
      await updateChoreography(choreography.id, { isPublic: false }, choreography.ownerId);
      setShowSharingModeMenu(false);
      setShowMenu(false);
      setToast({ message: t('choreographies.share.madePrivate'), type: 'success' });
    } catch (error) {
      console.error('Failed to make choreography private:', error);
      setToast({ message: t('common.error'), type: 'error' });
    }
  };

  const handleCopyChoreography = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!choreography) return;
    
    try {
      // Create a copy with "Copy of ..." prefix
      const copyName = t('choreographies.detail.copyOf', { name: choreography.name });
      const copiedChoreography: Choreography = {
        ...choreography,
        name: copyName,
      };
      
      await copyChoreography(copiedChoreography);
      navigate('/choreographies', { 
        replace: true,
        state: {
          toast: {
            message: t('choreographies.detail.duplicateSuccess'),
            type: 'success' as const,
          },
        },
      });
    } catch (error) {
      console.error('Failed to copy choreography:', error);
      setToast({ message: t('common.error'), type: 'error' });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canEdit) return;
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

    // Optimistic update for public choreography
    if (isViewingPublicChoreography && publicChoreography) {
      setPublicChoreography({
        ...publicChoreography,
        movements: updatedMovements,
      });
    }
    updateChoreography(choreography.id, { movements: updatedMovements }, choreography.ownerId);
  };

  // Sort movements by order
  const sortedMovements = [...choreography.movements].sort((a, b) => a.order - b.order);
  const movementIds = sortedMovements.map((m) => m.id);

  return (
    <>
      {/* Header with back icon and title */}
      <HeaderBackTitle
        title={
          <div className="flex items-center gap-2 w-full">
            <h1 className="text-2xl font-bold leading-tight line-clamp-2 flex-1">{choreography.name}</h1>
            {choreography.isPublic && ((isViewingPublicChoreography && isFollowing && ownerName) || (choreography.ownerId === user?.uid || (!isViewingPublicChoreography && user && contextChoreography?.isPublic))) && (
              <button
                onClick={() => setShowChoreographyInfoModal(true)}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all touch-manipulation"
                aria-label={t('choreographies.share.info')}
              >
                <Users className="h-5 w-5 text-destructive flex-shrink-0" />
              </button>
            )}
          </div>
        }
        titleClassName="flex-1"
      >
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
                <div className="absolute right-0 top-full mt-2 rounded-md border bg-popover shadow-lg z-[60] py-1 min-w-[200px]">
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
                  {choreography.isPublic && (
                    <div className="relative">
                      <button
                        onClick={() => setShowSharingModeMenu(!showSharingModeMenu)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-3"
                      >
                        {choreography.sharingMode === 'collaborative' ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        {t('choreographies.share.sharingMode.title')}
                      </button>
                      {showSharingModeMenu && (
                        <div className="absolute left-0 md:left-full top-full md:top-0 mt-1 md:mt-0 md:ml-1 rounded-md border bg-popover shadow-lg py-1 w-full md:w-auto md:min-w-[220px] z-[70]">
                          <button
                            onClick={() => handleChangeSharingMode('view-only')}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-accent ${
                              choreography.sharingMode === 'view-only' ? 'bg-accent' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium">{t('choreographies.share.sharingMode.viewOnly')}</div>
                                <div className="text-xs text-muted-foreground">{t('choreographies.share.sharingMode.viewOnlyDescription')}</div>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleChangeSharingMode('collaborative')}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-accent ${
                              choreography.sharingMode === 'collaborative' ? 'bg-accent' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium">{t('choreographies.share.sharingMode.collaborative')}</div>
                                <div className="text-xs text-muted-foreground">{t('choreographies.share.sharingMode.collaborativeDescription')}</div>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={handleMakePrivate}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
                          >
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium">{t('choreographies.share.sharingMode.private')}</div>
                                <div className="text-xs text-muted-foreground">{t('choreographies.share.sharingMode.privateDescription')}</div>
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleDuplicateChoreography}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-3"
                  >
                    <Copy className="h-4 w-4" />
                    {t('choreographies.detail.duplicate')}
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
      </HeaderBackTitle>
      {/* Badges */}
      <div className="flex flex-wrap gap-2 items-center">
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

      {/* Movements List */}
      {sortedMovements.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={movementIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 my-6 max-w-lg mx-auto w-full">
              {sortedMovements.map((movement) => (
                <SortableMovementItem
                  key={`${movement.id}-${colorUpdateKey}`}
                  movement={movement}
                  choreography={choreography}
                  isEditing={editingId === movement.id}
                  onStartEdit={() => canEdit && setEditingId(movement.id)}
                  onEndEdit={(name, mentionId, mentionType) => {
                    if (!canEdit) return;
                    if (!name.trim()) {
                      // If empty name and it's a new movement (no name originally), delete it
                      if (!movement.name) {
                        handleDeleteMovement(movement.id);
                      } else {
                        // Keep original name if editing existing
                        handleUpdateMovementName(movement.id, movement.name, movement.mentionId, movement.mentionType);
                      }
                    } else {
                      handleUpdateMovementName(movement.id, name, mentionId, mentionType);
                    }
                  }}
                  onDelete={() => canEdit && handleDeleteMovement(movement.id)}
                  onDuplicate={() => canEdit && handleDuplicateMovement(movement.id)}
                  onCopy={canEdit ? () => handleCopyMovement(movement) : undefined}
                  colorUpdateKey={colorUpdateKey}
                  onColorChange={canEdit ? handleColorChange : () => {}}
                  isReadOnly={!canEdit}
                  currentChoreographyId={choreography.id}
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
        {(canEdit || (isExampleChoreography && !user)) && sortedMovements.length > 0 && (
          <div className="flex gap-2 w-full max-w-lg mx-auto">
            <Button
              variant={canPaste ? 'outline' : 'default'}
              onClick={handleAddMovement}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('choreographies.movements.add')}
            </Button>
            {canPaste && (
              <Button
                variant="default"
                onClick={handlePasteMovement}
                className="h-10 w-10 p-0"
                aria-label={t('choreographies.movements.paste')}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        {isViewingPublicChoreography && choreography && (
          <div className="flex flex-row gap-2 w-full max-w-lg mx-auto">
            {!isFollowing ? (
              <Button
                variant="default"
                className="flex-1"
                size="lg"
                onClick={handleFollow}
              >
                <UserPlus className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="truncate text-xs sm:text-sm">{t('choreographies.share.follow')}</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={handleUnfollow}
              >
                <UserMinus className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="truncate text-xs sm:text-sm">{t('choreographies.share.unfollow')}</span>
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={handleCopyChoreography}
            >
              <Copy className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate text-xs sm:text-sm hidden sm:inline">{t('choreographies.share.duplicateToMyChoreographies')}</span>
              <span className="truncate text-xs sm:text-sm sm:hidden">{t('choreographies.detail.duplicate')}</span>
            </Button>
          </div>
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
      
      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Choreography Info Modal */}
      {choreography?.isPublic && ((isViewingPublicChoreography && isFollowing && ownerName) || (choreography.ownerId === user?.uid || (!isViewingPublicChoreography && user && contextChoreography?.isPublic))) && (
        <Dialog open={showChoreographyInfoModal} onOpenChange={setShowChoreographyInfoModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('choreographies.share.info')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {t('choreographies.share.ownedBy', { name: '' }).split('{{name}}')[0]}
                </div>
                <div className="text-base font-semibold">
                  {(choreography.ownerId === user?.uid || (!isViewingPublicChoreography && user && contextChoreography?.isPublic)) ? t('choreographies.share.myself') : ownerName}
                </div>
              </div>
              
              {choreography.sharingMode && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {t('choreographies.share.sharingMode.title')}
                  </div>
                  <div className="text-base font-semibold">
                    {choreography.sharingMode === 'view-only'
                      ? t('choreographies.share.sharingMode.viewOnly')
                      : choreography.sharingMode === 'collaborative'
                      ? t('choreographies.share.sharingMode.collaborative')
                      : t('choreographies.share.sharingMode.private')}
                  </div>
                </div>
              )}
              
              {choreography.createdAt && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {t('choreographies.share.createdAt')}
                  </div>
                  <div className="text-base">
                    {new Date(choreography.createdAt).toLocaleDateString(i18n.language, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
