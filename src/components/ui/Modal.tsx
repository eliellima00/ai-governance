import React from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl'
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: keyof typeof SIZE_CLASSES;
  children: React.ReactNode;
}

/** Shell único de overlay + painel para todos os modais do app (confirmação, formulário rápido). */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-grey-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-lg w-full ${SIZE_CLASSES[size]} shadow-2xl border border-grey-200 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-grey-200 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-grey-900">{title}</h3>
            {subtitle && <p className="text-xs text-grey-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-grey-400 hover:text-grey-600 shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
};

export const ModalFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <div
    className={`flex justify-end gap-3 -mx-6 -mb-6 mt-6 px-6 py-4 border-t border-grey-200 bg-grey-50 rounded-b-lg ${className}`}
    {...rest}
  >
    {children}
  </div>
);
