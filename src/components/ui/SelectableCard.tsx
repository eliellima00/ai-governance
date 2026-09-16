import React from 'react';

export interface SelectableCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Card clicável estilo "radio" — usado nos seletores de Tipo A/B/C (cadastro e estimativa). */
export const SelectableCard: React.FC<SelectableCardProps> = ({
  selected = false,
  className = '',
  children,
  ...rest
}) => (
  <button
    type="button"
    className={`text-left p-3 rounded-lg border text-sm transition-all ${
      selected
        ? 'border-brand-main bg-brand-lighter text-brand-dark font-semibold ring-1 ring-brand-main'
        : 'border-grey-200 bg-white text-grey-700 hover:bg-grey-50'
    } ${className}`}
    {...rest}
  >
    {children}
  </button>
);
