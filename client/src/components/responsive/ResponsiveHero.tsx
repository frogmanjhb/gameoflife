import React from 'react';

interface ResponsiveHeroProps {
  children: React.ReactNode;
  className?: string;
}

/** Dashboard hero banner — stacks on mobile, side-by-side on desktop. */
export const ResponsiveHero: React.FC<ResponsiveHeroProps> = ({ children, className = '' }) => (
  <div className={`rounded-2xl p-4 sm:p-6 ${className}`}>{children}</div>
);

interface ResponsiveHeroContentProps {
  children: React.ReactNode;
}

export const ResponsiveHeroContent: React.FC<ResponsiveHeroContentProps> = ({ children }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between min-w-0">
    {children}
  </div>
);

interface ResponsiveHeroAsideProps {
  children: React.ReactNode;
}

/** Secondary hero info (game day, town count) — stacks on mobile. */
export const ResponsiveHeroAside: React.FC<ResponsiveHeroAsideProps> = ({ children }) => (
  <div className="flex flex-wrap items-stretch gap-3 sm:gap-6 shrink-0">{children}</div>
);
