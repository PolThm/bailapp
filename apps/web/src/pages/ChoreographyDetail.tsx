import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DanceStyleBadge,
  DanceSubStyleBadge,
  ComplexityBadge,
} from '@/components/ui/badge';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useChoreographies } from '@/context/ChoreographiesContext';

export function ChoreographyDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getChoreography, deleteChoreography } = useChoreographies();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const choreography = id ? getChoreography(id) : undefined;

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

  return (
    <>
      {/* Header with back icon and title */}
      <div className="pb-2">
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

