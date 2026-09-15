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
      {/* Circular Seed/Plant Logo with Radial Yellow/Amber Gradient and Green Accents */}
      <div className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
        <svg viewBox="0 0 36 36" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Gradient from #FFED00 to #EAB818 */}
            <radialGradient
              id="attoSeedGradient"
              cx="35%"
              cy="35%"
              r="65%"
              fx="25%"
              fy="25%"
            >
              <stop offset="0%" stopColor="#FFED00" />
              <stop offset="70%" stopColor="#F5C712" />
              <stop offset="100%" stopColor="#EAB818" />
            </radialGradient>
          </defs>

          {/* Golden Circle Base */}
          <circle cx="18" cy="18" r="18" fill="url(#attoSeedGradient)" />

          {/* Inner Stylized Seed / Leaf Accents in Brand Greens */}
          {/* Main Leaf Body in #5C8834 */}
          <path
            d="M18 7C18 7 26 13 25 21C24.2 27.5 18 29 18 29C18 29 12 27.5 11 21C10 13 18 7 18 7Z"
            fill="#5C8834"
          />
          {/* Secondary Light Leaf Arc in #75AD40 */}
          <path
            d="M18 10C18 10 23.5 14.5 22.8 20.5C22.2 25 18 27.5 18 27.5C18 27.5 20.5 23 20 18C19.6 14.2 18 10 18 10Z"
            fill="#75AD40"
          />
          {/* Sprout Core Accent in #B6C932 */}
          <path
            d="M18 13C17.2 16.5 15.5 20 14 22C14.8 20 16 16.5 18 13Z"
            fill="#B6C932"
          />
        </svg>
      </div>

      {/* Wordmark and Product / Subtitle */}
      {!isCollapsed && (
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black text-base tracking-tight font-sans ${
                isDark ? 'text-white' : 'text-[#1D405A]'
              }`}
            >
              ATTO
            </span>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-[#A9CE88]' : 'text-[#5C8834]'
              }`}
            >
              Sementes
            </span>
          </div>
          <div
            className={`text-[10px] font-medium tracking-normal truncate mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-[#6B7280]'
            }`}
          >
            {subtitle} • <span className="font-semibold text-emerald-500/90">Industriatto</span>
          </div>
        </div>
      )}
    </div>
  );
};
