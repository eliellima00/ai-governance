import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonColor = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const COLOR_CLASSES: Record<ButtonColor, string> = {
  primary: 'bg-brand-dark text-white hover:bg-brand-main disabled:bg-grey-300',
  secondary: 'bg-white text-grey-700 border border-grey-300 hover:bg-grey-50 disabled:text-grey-400',
  danger: 'bg-danger-800 text-white hover:bg-danger-500 disabled:bg-grey-300'
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      color = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading = false,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center rounded-full font-semibold transition-colors disabled:cursor-not-allowed ${COLOR_CLASSES[color]} ${SIZE_CLASSES[size]} ${className}`}
        {...rest}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
