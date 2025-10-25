import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function ComingSoonModal({ open, onClose, title, description }: ComingSoonModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>{title || t('comingSoon.title')}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="mt-2">
          {description || t('comingSoon.description')}
        </DialogDescription>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="mx-auto w-full">
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
