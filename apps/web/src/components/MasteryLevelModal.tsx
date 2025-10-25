import { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface MasteryLevelModalProps {
  open: boolean;
  onClose: () => void;
  currentLevel: number | undefined;
  onSave: (level: number) => void;
}

export function MasteryLevelModal({ open, onClose, currentLevel, onSave }: MasteryLevelModalProps) {
  const { t } = useTranslation();
  const [level, setLevel] = useState<number>(currentLevel ?? 0);

  useEffect(() => {
    if (open) {
      setLevel(currentLevel ?? 0);
    }
  }, [open, currentLevel]);

  const handleIncrement = () => {
    if (level < 100) {
      setLevel(Math.min(level + 10, 100));
    }
  };

  const handleDecrement = () => {
    if (level > 0) {
      setLevel(Math.max(level - 10, 0));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      const clampedValue = Math.max(0, Math.min(100, value));
      // Round to nearest 10
      const roundedValue = Math.round(clampedValue / 10) * 10;
      setLevel(roundedValue);
    } else if (e.target.value === '') {
      setLevel(0);
    }
  };

  const handleSave = () => {
    onSave(level);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="space-y-1">
        <DialogHeader onClose={onClose} className="mb-0">
          <DialogTitle className="text-center">{t('figure.mastery.updateTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={level <= 0}
              className="h-10 w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex flex-1 items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="10"
                value={level}
                onChange={handleInputChange}
                className="text-center text-lg font-semibold sm:w-56"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={level >= 100}
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="mx-auto w-full">
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
