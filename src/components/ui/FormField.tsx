import React from 'react';

const FIELD_BASE =
  'w-full px-3 py-2 border border-grey-300 rounded-md text-sm bg-white text-grey-900 focus:outline-hidden focus:ring-2 focus:ring-brand-main disabled:bg-grey-100 disabled:text-grey-400';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <label className={`font-semibold text-grey-700 text-sm block mb-1.5 ${className}`} {...rest}>
    {children}
  </label>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...rest }, ref) => (
    <input ref={ref} className={`${FIELD_BASE} ${className}`} {...rest} />
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...rest }, ref) => (
  <textarea ref={ref} className={`${FIELD_BASE} ${className}`} {...rest} />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = '', children, ...rest }, ref) => (
  <select ref={ref} className={`${FIELD_BASE} ${className}`} {...rest}>
    {children}
  </select>
));
Select.displayName = 'Select';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

/** Combina Label + controle + dica opcional, para reduzir repetição nos formulários. */
export const Field: React.FC<FieldProps> = ({ label, htmlFor, hint, required, children }) => (
  <div>
    <Label htmlFor={htmlFor}>
      {label}
      {required && <span className="text-danger-500 ml-1 font-bold">*</span>}
    </Label>
    {children}
    {hint && <p className="text-xs text-grey-500 mt-1">{hint}</p>}
  </div>
);

export const FormField = Field;
export type FormFieldProps = FieldProps;

