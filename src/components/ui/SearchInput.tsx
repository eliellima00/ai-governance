import React from 'react';
import { Search } from 'lucide-react';

export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...rest }, ref) => (
  <div className="relative">
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
    <input
      ref={ref}
      type="text"
      className={`w-full pl-9 pr-3 py-2 border border-grey-300 rounded-md text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-main ${className}`}
      {...rest}
    />
  </div>
));
SearchInput.displayName = 'SearchInput';
