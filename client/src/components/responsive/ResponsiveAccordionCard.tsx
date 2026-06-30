import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ResponsiveAccordionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Tap-to-expand summary card for mobile dashboards. */
const ResponsiveAccordionCard: React.FC<ResponsiveAccordionCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  open,
  onToggle,
  children,
  className = '',
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
      open
        ? 'border-primary-200 shadow-md ring-1 ring-primary-100/80'
        : 'border-gray-200/90 shadow-sm hover:border-gray-300 hover:shadow'
    } ${className}`}
  >
    <div
      className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-colors duration-200 ${
        open ? 'bg-primary-500' : 'bg-primary-300/70'
      }`}
      aria-hidden
    />
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 pl-5 pr-3 py-3.5 text-left min-h-[64px] transition-colors ${
        open ? 'bg-primary-50/40' : 'hover:bg-gray-50/90 active:bg-gray-100/80'
      }`}
      aria-expanded={open}
    >
      {icon && (
        <span
          className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200 [&>svg]:h-5 [&>svg]:w-5 ${
            open
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 ring-1 ring-primary-100'
          }`}
        >
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 leading-tight">{title}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 truncate mt-1 leading-snug">{subtitle}</p>
        )}
      </div>
      {badge}
      <span
        className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
          open ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
        }`}
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </span>
    </button>
    {open && (
      <div className="border-t border-gray-100 bg-gray-50/60 px-4 pb-4 pt-3">{children}</div>
    )}
  </div>
);

export default ResponsiveAccordionCard;
