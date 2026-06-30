import React from 'react';

interface ResponsivePageProps {
  children: React.ReactNode;
  className?: string;
}

/** Page wrapper with consistent padding, max-width, and vertical spacing. */
const ResponsivePage: React.FC<ResponsivePageProps> = ({ children, className = '' }) => (
  <div className={`space-y-4 sm:space-y-6 min-w-0 ${className}`}>{children}</div>
);

export default ResponsivePage;
