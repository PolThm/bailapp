import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface HeaderBackTitleProps {
  title: string;
  onBack?: () => void;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
}

export function HeaderBackTitle({
  title,
  onBack,
  children,
  className = '',
  titleClassName = '',
}: HeaderBackTitleProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = onBack || (() => navigate(-1));

  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={handleBack}
          className="h-9 flex items-center justify-center rounded-full hover:bg-muted active:scale-95 transition-all touch-manipulation"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className={`text-2xl font-bold leading-tight line-clamp-2 ${titleClassName}`}>
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

