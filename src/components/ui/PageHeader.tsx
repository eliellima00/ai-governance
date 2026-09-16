import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-grey-900">{title}</h1>
      {subtitle && <p className="text-sm text-grey-500 mt-1 max-w-2xl">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
  </div>
);
