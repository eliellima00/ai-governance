import React from 'react';
import { Check } from 'lucide-react';

export interface ChecklistItemProps {
  checked?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}

/** Item de checklist consistente (bullet marcado/desmarcado), com ou sem interação de clique. */
export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  checked = false,
  onToggle,
  disabled = false,
  children,
  trailing
}) => {
  const isInteractive = !!onToggle && !disabled;

  return (
    <div className={`flex items-start gap-2.5 text-sm ${disabled ? 'opacity-60' : ''}`}>
      <span
        onClick={isInteractive ? onToggle : undefined}
        className={`mt-0.5 w-4 h-4 rounded shrink-0 border flex items-center justify-center ${
          checked ? 'bg-brand-main border-brand-main text-white' : 'bg-white border-grey-300'
        } ${isInteractive ? 'cursor-pointer' : ''}`}
      >
        {checked && <Check className="w-3 h-3" />}
      </span>
      <span className="flex-1 text-grey-700">{children}</span>
      {trailing}
    </div>
  );
};
