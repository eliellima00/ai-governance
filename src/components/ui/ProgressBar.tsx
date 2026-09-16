import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  colorClassName?: string;
  trackClassName?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  colorClassName = 'bg-brand-main',
  trackClassName = 'bg-grey-100',
  className = ''
}) => (
  <div className={`w-full h-2 rounded-full overflow-hidden ${trackClassName} ${className}`}>
    <div
      className={`h-full rounded-full transition-all ${colorClassName}`}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);
