import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  className = ''
}: TabsProps<T>) {
  return (
    <div className={`inline-flex flex-wrap items-center gap-1 p-1 bg-grey-100 rounded-lg ${className}`}>
      {items.map((item) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              isActive ? 'bg-white text-grey-900 shadow-2xs' : 'text-grey-500 hover:text-grey-700'
            }`}
          >
            <span>{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
