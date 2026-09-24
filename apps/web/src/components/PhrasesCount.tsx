import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function PhrasesCountBadge({ count }: { count: number }) {
  const { t } = useTranslation();

  return (
    <span
      className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground"
      title={t('choreographies.movements.phrasesCount')}
    >
      <Clock className="h-4 w-4" />
      {count}
    </span>
  );
}

interface PhrasesCountModalProps {
  open: boolean;
  onClose: () => void;
  value?: number;
  figurePhrasesCount?: number; // Used when the value is left empty
  onSave: (phrasesCount: number | undefined) => void;
}

export function PhrasesCountModal({
  open,
  onClose,
  value,
  figurePhrasesCount,
  onSave,
}: PhrasesCountModalProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  useEffect(() => {
    if (open) {
      setInput(value !== undefined ? String(value) : '');
    }
  }, [open, value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(input, 10);
    onSave(Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader onClose={onClose}>
          <DialogTitle>{t('choreographies.movements.phrasesCount')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                figurePhrasesCount !== undefined
                  ? String(figurePhrasesCount)
                  : t('newFigure.phrasesCountPlaceholder')
              }
            />
            <p className="text-xs text-muted-foreground">
              {figurePhrasesCount !== undefined
                ? t('choreographies.movements.phrasesCountFigureHint')
                : t('choreographies.movements.phrasesCountHint')}
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
