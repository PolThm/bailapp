import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleProps {
  title: string;
  /** Short summary of what is inside, shown while collapsed. */
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Disclosure section used to keep optional form fields out of the way. */
export function Collapsible({ title, hint, defaultOpen = false, children }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-md border border-input">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium">{title}</span>
          {hint && !isOpen && (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{hint}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="space-y-4 border-t border-input px-4 py-4">{children}</div>}
    </div>
  );
}
