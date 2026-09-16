import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * Pílula de status neutra em estilo; a cor vem de fora via `className`
 * (ex.: as classes já centralizadas em `getRiskColorClass`).
 */
export const Badge: React.FC<BadgeProps> = ({ className = '', children, ...rest }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};
