import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChoreographies } from '@/context/ChoreographiesContext';
import type { DanceStyle, DanceSubStyle, Complexity, Choreography } from '@/types';

interface NewChoreographyModalProps {
  open: boolean;
  onClose: () => void;
  choreography?: Choreography; // Optional: if provided, we're in edit mode
}

export function NewChoreographyModal({ open, onClose, choreography }: NewChoreographyModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addChoreography, updateChoreography } = useChoreographies();
  const isEditMode = !!choreography;
  const [formData, setFormData] = useState<{
    name: string;
    danceStyle?: DanceStyle;
    danceSubStyle?: DanceSubStyle;
    complexity?: Complexity;
    phrasesCount?: number;
  }>({ name: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or choreography changes
  useEffect(() => {
    if (open) {
      if (choreography) {
        // Edit mode: pre-fill with existing data
        setFormData({
          name: choreography.name,
          danceStyle: choreography.danceStyle,
          danceSubStyle: choreography.danceSubStyle,
          complexity: choreography.complexity,
          phrasesCount: choreography.phrasesCount,
        });
      } else {
        // New mode: reset form
        setFormData({ name: '' });
      }
      setErrors({});
    }
  }, [open, choreography]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = t('choreographies.newChoreography.errors.nameRequired');
    }
    if (!formData.danceStyle) {
      newErrors.danceStyle = t('choreographies.newChoreography.errors.danceStyleRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditMode && choreography) {
      // Update existing choreography - only include defined values
      const updates: Partial<Choreography> = {
        name: formData.name.trim(),
        danceStyle: formData.danceStyle!,
      };
      
      // Include optional fields - preserve existing values if not explicitly set to undefined
      // If the form has a value (even if it was originally undefined), include it
      updates.danceSubStyle = formData.danceSubStyle;
      updates.complexity = formData.complexity;
      if (formData.phrasesCount !== undefined) {
        updates.phrasesCount = formData.phrasesCount;
      }
      
      updateChoreography(choreography.id, updates);
      handleClose();
    } else {
      // Create new choreography
      const newChoreography = {
        id: crypto.randomUUID(), // Temporary ID, will be replaced by Firestore ID
        name: formData.name.trim(),
        danceStyle: formData.danceStyle!,
        danceSubStyle: formData.danceSubStyle,
        complexity: formData.complexity,
        phrasesCount: formData.phrasesCount,
        movements: [],
        createdAt: new Date().toISOString(),
      };

      try {
        const firestoreId = await addChoreography(newChoreography);
        // Close and navigate with the Firestore ID
      handleClose();
        navigate(`/choreography/${firestoreId}`);
      } catch (error) {
        console.error('Failed to create choreography:', error);
        // Don't close modal on error so user can retry
      }
    }
  };

  const handleClose = () => {
    setFormData({ name: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader onClose={handleClose}>
          <DialogTitle>
            {isEditMode ? t('choreographies.edit.title') : t('choreographies.newChoreography.title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Choreography Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('choreographies.newChoreography.name')} {t('newFigure.required')}
            </Label>
            <Input
              id="name"
              placeholder={t('choreographies.newChoreography.namePlaceholder')}
              value={formData.name}
              onChange={(e) => {
                const newName = e.target.value;
                setFormData({ ...formData, name: newName });
                // Clear error if field is now valid
                if (errors.name && newName.trim()) {
                  const { name, ...restErrors } = errors;
                  setErrors(restErrors);
                }
              }}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Dance Style */}
          <div className="space-y-2">
            <Label htmlFor="danceStyle">
              {t('newFigure.danceStyle')} {t('newFigure.required')}
            </Label>
            <Select
              value={formData.danceStyle}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  danceStyle: value as DanceStyle,
                  danceSubStyle: undefined,
                });
                // Clear error if field is now valid
                if (errors.danceStyle) {
                  const { danceStyle, ...restErrors } = errors;
                  setErrors(restErrors);
                }
              }}
            >
              <SelectTrigger
                className={errors.danceStyle ? 'border-destructive' : ''}
              >
                <SelectValue placeholder={t('newFigure.danceStylePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salsa">{t('badges.danceStyle.salsa')}</SelectItem>
                <SelectItem value="bachata">{t('badges.danceStyle.bachata')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.danceStyle && (
              <p className="text-sm text-destructive">{errors.danceStyle}</p>
            )}
          </div>

          {/* Dance Sub-Style */}
          {formData.danceStyle && (
            <div className="space-y-2">
              <Label htmlFor="danceSubStyle">{t('newFigure.danceSubStyle')}</Label>
              <Select
                value={formData.danceSubStyle}
                onValueChange={(value) =>
                  setFormData({ ...formData, danceSubStyle: value ? (value as DanceSubStyle) : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('newFigure.danceSubStylePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {formData.danceStyle === 'salsa' && (
                    <>
                      <SelectItem value="cuban">{t('badges.danceSubStyle.cuban')}</SelectItem>
                      <SelectItem value="la-style">{t('badges.danceSubStyle.lastyle')}</SelectItem>
                      <SelectItem value="ny-style">{t('badges.danceSubStyle.nystyle')}</SelectItem>
                      <SelectItem value="puerto-rican">{t('badges.danceSubStyle.puertorican')}</SelectItem>
                      <SelectItem value="colombian">{t('badges.danceSubStyle.colombian')}</SelectItem>
                      <SelectItem value="rueda-de-casino">{t('badges.danceSubStyle.ruedadecasino')}</SelectItem>
                      <SelectItem value="romantica">{t('badges.danceSubStyle.romantica')}</SelectItem>
                    </>
                  )}
                  {formData.danceStyle === 'bachata' && (
                    <>
                      <SelectItem value="dominican">{t('badges.danceSubStyle.dominican')}</SelectItem>
                      <SelectItem value="modern">{t('badges.danceSubStyle.modern')}</SelectItem>
                      <SelectItem value="sensual">{t('badges.danceSubStyle.sensual')}</SelectItem>
                      <SelectItem value="urban">{t('badges.danceSubStyle.urban')}</SelectItem>
                      <SelectItem value="fusion">{t('badges.danceSubStyle.fusion')}</SelectItem>
                      <SelectItem value="ballroom">{t('badges.danceSubStyle.ballroom')}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Complexity */}
          <div className="space-y-2">
            <Label htmlFor="complexity">{t('newFigure.complexity')}</Label>
            <Select
              value={formData.complexity}
              onValueChange={(value) =>
                setFormData({ ...formData, complexity: value ? (value as Complexity) : undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('newFigure.complexityPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">{t('badges.complexity.basic')}</SelectItem>
                <SelectItem value="basic-intermediate">
                  {t('badges.complexity.basicIntermediate')}
                </SelectItem>
                <SelectItem value="intermediate">{t('badges.complexity.intermediate')}</SelectItem>
                <SelectItem value="intermediate-advanced">
                  {t('badges.complexity.intermediateAdvanced')}
                </SelectItem>
                <SelectItem value="advanced">{t('badges.complexity.advanced')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1">
              {isEditMode ? t('common.save') : t('choreographies.newChoreography.validate')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

