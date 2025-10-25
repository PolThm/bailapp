import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface HeaderBackTitleProps {
  title: string | ReactNode;
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
      <div className="mb-2 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex h-9 touch-manipulation items-center justify-center rounded-full transition-all hover:bg-muted active:scale-95"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {typeof title === 'string' ? (
          <h1 className={`line-clamp-2 text-2xl font-bold leading-tight ${titleClassName}`}>
            {title}
          </h1>
        ) : (
          <div className={`text-2xl font-bold leading-tight ${titleClassName}`}>{title}</div>
        )}
        {children}
      </div>
    </div>
  );
}
