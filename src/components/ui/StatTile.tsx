import React from 'react';

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'light' | 'dark';
}

/** Card de KPI (label + ícone + valor + subtexto); opcionalmente clicável, com estado "ativo" via ring. */
export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  subtext,
  icon,
  iconClassName = 'bg-grey-100 text-grey-600',
  active = false,
  onClick,
  className = '',
  variant = 'light'
}) => {
  const isDark = variant === 'dark';
  const Wrapper: any = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`text-left rounded-lg border p-3.5 min-w-0 transition-all ${
        isDark ? 'bg-grey-900 border-grey-800 text-white' : 'bg-white border-grey-200 text-grey-900'
      } ${active ? 'ring-2 ring-brand-light border-brand-main' : ''} ${
        onClick ? 'cursor-pointer hover:border-brand-main' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${isDark ? 'text-grey-300' : 'text-grey-500'}`}>
          {label}
        </span>
        {icon && <span className={`p-1.5 rounded-lg shrink-0 ${iconClassName}`}>{icon}</span>}
      </div>
      <div className="text-2xl font-black mt-1 truncate">{value}</div>
      {subtext && (
        <div className={`text-[11px] mt-0.5 ${isDark ? 'text-grey-400' : 'text-grey-500'}`}>
          {subtext}
        </div>
      )}
    </Wrapper>
  );
};
