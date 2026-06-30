import React from 'react';

interface ResponsiveFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

/** Form wrapper with full-width inputs and touch-friendly spacing. */
const ResponsiveForm: React.FC<ResponsiveFormProps> = ({ children, onSubmit, className = '' }) => (
  <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
    {children}
  </form>
);

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="label">
        {label}
      </label>
      <input
        id={inputId}
        className={`input-field min-h-[44px] ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface ResponsiveSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const ResponsiveSelect: React.FC<ResponsiveSelectProps> = ({
  label,
  error,
  id,
  children,
  className = '',
  ...props
}) => {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="min-w-0">
      <label htmlFor={selectId} className="label">
        {label}
      </label>
      <select
        id={selectId}
        className={`input-field min-h-[44px] ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface ResponsiveFormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveFormActions: React.FC<ResponsiveFormActionsProps> = ({
  children,
  className = '',
}) => (
  <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 [&>button]:min-h-[44px] [&>button]:w-full sm:[&>button]:w-auto ${className}`}>
    {children}
  </div>
);

export default ResponsiveForm;
