import { useState } from 'react';
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
import type { DanceStyle, DanceSubStyle, Complexity } from '@/types';

interface NewChoreographyModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewChoreographyModal({ open, onClose }: NewChoreographyModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addChoreography } = useChoreographies();
  const [formData, setFormData] = useState<{
    name: string;
    danceStyle?: DanceStyle;
    danceSubStyle?: DanceSubStyle;
    complexity?: Complexity;
    phrasesCount?: number;
  }>({ name: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
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

    // Create choreography
    const newChoreography = {
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      danceStyle: formData.danceStyle!,
      danceSubStyle: formData.danceSubStyle,
      complexity: formData.complexity,
      phrasesCount: formData.phrasesCount,
      movements: [],
      createdAt: new Date().toISOString(),
    };

    addChoreography(newChoreography);

    // Close and navigate
    handleClose();
    navigate(`/choreography/${newChoreography.id}`);
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
          <DialogTitle>{t('choreographies.newChoreography.title')}</DialogTitle>
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  danceStyle: value as DanceStyle,
                  danceSubStyle: undefined,
                })
              }
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
                  setFormData({ ...formData, danceSubStyle: value as DanceSubStyle })
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
                setFormData({ ...formData, complexity: value as Complexity })
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
              {t('choreographies.newChoreography.validate')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

