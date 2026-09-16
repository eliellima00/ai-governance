import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className = '', children, ...rest }) => {
  return (
    <div
      className={`bg-white rounded-lg border border-grey-200 shadow-card p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter: React.FC<CardFooterProps> = ({ className = '', children, ...rest }) => {
  return (
    <div
      className={`border-t border-grey-200 bg-grey-50 -mx-6 -mb-6 mt-6 px-6 py-4 rounded-b-lg flex justify-end gap-3 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
