import React from 'react';

interface AttoLogoProps {
  className?: string;
  isCollapsed?: boolean;
  subtitle?: string;
}

export const AttoLogo: React.FC<AttoLogoProps> = ({
  className = '',
  isCollapsed = false,
  subtitle = 'Governança T.I'
}) => {
  if (isCollapsed) {
    return (
      <div className={`flex items-center justify-center select-none ${className}`}>
        <img src="/short-logo.svg" alt="ATTO Sementes" className="w-8 h-8" draggable={false} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col select-none min-w-0 ${className}`}>
      <img src="/logo.svg" alt="ATTO Sementes" className="h-8 w-auto" draggable={false} />
      <div className="text-[10px] font-medium tracking-normal truncate mt-1 text-grey-500">
        {subtitle} • <span className="font-semibold text-brand-main/90">Industriatto</span>
      </div>
    </div>
  );
};
