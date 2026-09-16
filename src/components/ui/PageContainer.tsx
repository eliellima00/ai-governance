import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PageContainer: React.FC<PageContainerProps> = ({
  className = '',
  children,
  ...rest
}) => (
  <div className={`max-w-3xl mx-auto space-y-6 ${className}`} {...rest}>
    {children}
  </div>
);
