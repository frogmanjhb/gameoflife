import React from 'react';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: 'div' | 'button';
  active?: boolean;
}

/** Standard card with responsive padding and overflow handling. */
const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  onClick,
  as = 'div',
  active = false,
}) => {
  const base =
    'bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 min-w-0 overflow-hidden';
  const activeClass = active ? 'ring-2 ring-primary-500 ring-offset-1' : '';
  const combined = `${base} ${activeClass} ${className}`;

  if (as === 'button') {
    return (
      <button type="button" onClick={onClick} className={`${combined} text-left w-full transition-colors`}>
        {children}
      </button>
    );
  }

  return <div className={combined}>{children}</div>;
};

export default ResponsiveCard;
