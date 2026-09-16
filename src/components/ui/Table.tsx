import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <div className="overflow-x-auto">
    <table className={`w-full text-sm ${className}`} {...rest}>
      {children}
    </table>
  </div>
);

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <thead className={`bg-grey-50 border-b border-grey-200 ${className}`} {...rest}>
    {children}
  </thead>
);

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <tbody className={`divide-y divide-grey-100 ${className}`} {...rest}>
    {children}
  </tbody>
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <tr className={`group hover:bg-grey-50 transition-colors ${className}`} {...rest}>
    {children}
  </tr>
);

export interface StickyProps {
  /**
   * Pins this cell to an edge of a horizontally-scrolling table — `"left"` for a leading
   * fixed column (e.g. a star/select toggle), `"right"` for a trailing one (e.g. "Ações").
   * The caller MUST also pass a solid `bg-*` class via `className` (matching the row's own
   * background, e.g. `bg-white` or a row-highlight color) — this component intentionally does not
   * hardcode one, to avoid two same-specificity Tailwind bg utilities racing for the same cell.
   */
  sticky?: 'left' | 'right';
}

const STICKY_CELL_CLASSES: Record<'left' | 'right', string> = {
  left: 'sticky left-0 z-10 shadow-[6px_0_8px_-6px_rgba(0,0,0,0.15)]',
  right: 'sticky right-0 z-10 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.15)]'
};

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement> & StickyProps> = ({
  className = '',
  sticky,
  children,
  ...rest
}) => (
  <th
    className={`text-left text-xs font-semibold text-grey-500 uppercase tracking-wide px-3 py-2.5 whitespace-nowrap ${
      sticky ? STICKY_CELL_CLASSES[sticky] : ''
    } ${className}`}
    {...rest}
  >
    {children}
  </th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement> & StickyProps> = ({
  className = '',
  sticky,
  children,
  ...rest
}) => (
  <td
    className={`px-3 py-2.5 text-grey-700 align-middle ${sticky ? STICKY_CELL_CLASSES[sticky] : ''} ${className}`}
    {...rest}
  >
    {children}
  </td>
);
