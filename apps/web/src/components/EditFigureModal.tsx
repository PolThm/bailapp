import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FigureUpdates } from '@/lib/services/figureService';
import type { Figure } from '@/types';
import { FigureMetadataFields } from '@/components/FigureMetadataFields';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EMPTY_FIGURE_METADATA, type FigureMetadataValues } from '@/lib/figureMetadata';

interface EditFigureModalProps {
  open: boolean;
  figure: Figure;
  onClose: () => void;
  /** Receives only the metadata; the video, visibility and owner are untouched. */
  onSubmit: (updates: FigureUpdates) => Promise<void>;
}

/**
 * Edits a figure's metadata. The video itself cannot be replaced: swapping the
 * media under an existing figure would invalidate its thumbnail, timings and
 * format all at once, and deleting and re-adding is clearer.
 */
function toFormValues(figure: Figure): FigureMetadataValues {
  return {
    ...EMPTY_FIGURE_METADATA,
    shortTitle: figure.shortTitle,
    description: figure.description ?? '',
    videoAuthor: figure.videoAuthor ?? '',
    startTime: figure.startTime ?? '',
    endTime: figure.endTime ?? '',
    previewStartTime: figure.previewStartTime ?? '',
    danceStyle: figure.danceStyle,
    danceSubStyle: figure.danceSubStyle,
    figureType: figure.figureType,
    complexity: figure.complexity,
    phrasesCount: figure.phrasesCount ? String(figure.phrasesCount) : '',
    videoLanguage: figure.videoLanguage,
  };
}

export function EditFigureModal({ open, figure, onClose, onSubmit }: EditFigureModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FigureMetadataValues>(() => toFormValues(figure));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reopening on a different figure, or after it was refreshed, must not show
  // the previous one's values.
  useEffect(() => {
    if (open) {
      setForm(toFormValues(figure));
      setErrors({});
      setSubmitError(null);
    }
  }, [open, figure]);

  const update = (patch: Partial<FigureMetadataValues>) =>
    setForm((current) => ({ ...current, ...patch }));

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Same two requirements as creation: a figure without them is unusable.
    const nextErrors: Record<string, string> = {};
    if (!form.shortTitle.trim()) nextErrors.shortTitle = t('newFigure.errors.titleRequired');
    if (!form.danceStyle) nextErrors.danceStyle = t('newFigure.errors.danceStyleRequired');

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const parsedPhrases = parseInt(form.phrasesCount, 10);
    // Cleared fields are sent as null so they are removed rather than kept:
    // undefined would be stripped by the serialiser and the old value would
    // survive an edit that meant to delete it.
    const updates: FigureUpdates = {
      shortTitle: form.shortTitle.trim(),
      description: form.description.trim() || null,
      videoAuthor: form.videoAuthor.trim() || null,
      startTime: form.startTime.trim() || null,
      endTime: form.endTime.trim() || null,
      previewStartTime: form.previewStartTime.trim() || null,
      danceStyle: form.danceStyle,
      danceSubStyle: form.danceSubStyle ?? null,
      figureType: form.figureType ?? null,
      complexity: form.complexity ?? null,
      phrasesCount: Number.isFinite(parsedPhrases) && parsedPhrases > 0 ? parsedPhrases : null,
      videoLanguage: form.videoLanguage ?? null,
    };

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(updates);
      onClose();
    } catch {
      setSubmitError(t('editFigure.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader onClose={handleClose}>
          <DialogTitle>{t('editFigure.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FigureMetadataFields values={form} onChange={update} errors={errors} />

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('editFigure.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
