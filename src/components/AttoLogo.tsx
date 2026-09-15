import React from 'react';

interface AttoLogoProps {
  className?: string;
  isCollapsed?: boolean;
  variant?: 'light' | 'dark';
  subtitle?: string;
}

export const AttoLogo: React.FC<AttoLogoProps> = ({
  className = '',
  isCollapsed = false,
  variant = 'light',
  subtitle = 'Governança T.I'
}) => {
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Original ATTO Seed/Plant Icon (public/short-logo.svg) */}
      <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
        <img src="/short-logo.svg" alt="ATTO Sementes" className="w-full h-full" draggable={false} />
      </div>

      {/* Wordmark and Product / Subtitle */}
      {!isCollapsed && (
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black text-base tracking-tight font-sans ${
                isDark ? 'text-white' : 'text-brand-wordmark'
              }`}
            >
              ATTO
            </span>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-brand-light' : 'text-brand-main'
              }`}
            >
              Sementes
            </span>
          </div>
          <div
            className={`text-[10px] font-medium tracking-normal truncate mt-0.5 ${
              isDark ? 'text-grey-400' : 'text-grey-500'
            }`}
          >
            {subtitle} • <span className="font-semibold text-brand-main/90">Industriatto</span>
          </div>
        </div>
      )}
    </div>
  );
};
