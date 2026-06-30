import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ResponsiveStatItemProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: LucideIcon;
  valueClassName?: string;
  /** Shorter label shown below sm breakpoint. */
  mobileLabel?: string;
  /** Tighter typography for dense stat grids on mobile. */
  compact?: boolean;
}

/** Single stat block: label, value, helper — wraps without overlap. */
export const ResponsiveStatItem: React.FC<ResponsiveStatItemProps> = ({
  label,
  value,
  helper,
  icon: Icon,
  valueClassName = 'text-gray-900',
  mobileLabel,
  compact = false,
}) => (
  <div className="min-w-0">
    <div className={`flex items-center gap-0.5 sm:gap-1 text-gray-500 ${compact ? 'mb-0.5' : 'mb-1'} ${compact ? '' : 'gap-1.5'}`}>
      {Icon && <Icon className={`shrink-0 ${compact ? 'h-3 w-3 lg:h-4 lg:w-4' : 'h-4 w-4'}`} />}
      <span className={`font-medium truncate ${compact ? 'text-[10px] lg:text-xs leading-tight' : 'text-xs'}`}>
        {mobileLabel ? (
          <>
            <span className="lg:hidden">{mobileLabel}</span>
            <span className="hidden lg:inline">{label}</span>
          </>
        ) : (
          label
        )}
      </span>
    </div>
    <p
      className={`font-bold break-words tabular-nums ${compact ? 'text-base lg:text-2xl leading-none' : 'text-lg sm:text-2xl'} ${valueClassName}`}
    >
      {value}
    </p>
    {helper && <p className="text-xs text-gray-500 mt-0.5 break-words">{helper}</p>}
  </div>
);

interface ResponsiveStatsProps {
  children: React.ReactNode;
  /** Mobile columns. Defaults to 1 (stacked). */
  mobileCols?: 1 | 2;
  className?: string;
}

/** Grid of stat items that stacks on mobile and avoids overlap. */
const ResponsiveStats: React.FC<ResponsiveStatsProps> = ({
  children,
  mobileCols = 1,
  className = '',
}) => (
  <div
    className={`grid ${mobileCols === 2 ? 'grid-cols-2' : 'grid-cols-1'} sm:grid-cols-2 gap-3 sm:gap-4 [&>*]:min-w-0 ${className}`}
  >
    {children}
  </div>
);

export default ResponsiveStats;
