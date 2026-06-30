import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabNavItem {
  id: string;
  label: string;
  /** Shorter label for mobile bottom nav */
  mobileLabel?: string;
  icon?: LucideIcon;
  badge?: number;
}

interface ResponsiveTabNavProps {
  tabs: TabNavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  variant?: 'primary' | 'emerald';
  className?: string;
}

const variantActiveStyles = {
  primary: 'border-primary-500 text-primary-600',
  emerald: 'border-emerald-500 text-emerald-600',
};

/** Horizontal tab nav — scrollable on mobile with touch-friendly targets. */
const ResponsiveTabNav: React.FC<ResponsiveTabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'primary',
  className = '',
}) => (
  <div className={`border-b border-gray-200 -mx-4 sm:mx-0 ${className}`}>
    <nav
      className="flex gap-1 sm:gap-2 px-4 sm:px-6 overflow-x-auto scrollbar-thin pb-px"
      role="tablist"
    >
      {tabs.map(({ id, label, mobileLabel, icon: Icon, badge }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => onTabChange(id)}
          className={`py-2.5 sm:py-3 px-2.5 sm:px-4 border-b-2 font-medium text-sm flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 min-h-[44px] transition-colors ${
            activeTab === id
              ? variantActiveStyles[variant]
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          <span className="sm:hidden">{mobileLabel ?? label}</span>
          <span className="hidden sm:inline">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  </div>
);

export default ResponsiveTabNav;
