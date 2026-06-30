import React, { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import ResponsiveStats, { ResponsiveStatItem } from './ResponsiveStats';

export interface TownTabStat {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}

/** Structured dashboard summary for teacher town tabs (cleaner than flat stat list). */
export interface TownTabSummary {
  studentCount: number;
  employedCount: number;
  unemployedCount: number;
  employmentPercent: number;
  activeLoans: number;
  pendingLoansLabel: string;
  totalBalanceFormatted: string;
  avgBalanceFormatted: string;
  treasuryFormatted: string;
  balanceIsPositive: boolean;
}

export interface TownTabOverview {
  mayorName: string;
  taxRate: number;
  taxEnabled?: boolean;
}

export interface TownTabItem {
  id: string | number;
  townName: string;
  classLabel: string;
  stats?: TownTabStat[];
  summary?: TownTabSummary;
  overview?: TownTabOverview;
}

interface ResponsiveTownTabsProps {
  towns: TownTabItem[];
  activeId: string | number | null;
  onSelect: (id: string | number) => void;
  /** Accent colour variant */
  variant?: 'primary' | 'emerald';
}

const variantStyles = {
  primary: {
    active: 'bg-gradient-to-br from-primary-50 to-primary-100/80 ring-2 ring-inset ring-primary-300/60',
    iconActive: 'bg-primary-500 text-white shadow-sm',
    titleActive: 'text-primary-800',
    metricTile: 'bg-white/70 border border-primary-100/80',
    financePanel: 'bg-white/50 border border-primary-100/60',
  },
  emerald: {
    active: 'bg-gradient-to-br from-emerald-50 to-teal-100/80 ring-2 ring-inset ring-emerald-300/60',
    iconActive: 'bg-emerald-600 text-white shadow-sm',
    titleActive: 'text-emerald-800',
    metricTile: 'bg-white/70 border border-emerald-100/80',
    financePanel: 'bg-white/50 border border-emerald-100/60',
  },
};

interface TownTabOverviewRowProps {
  overview: TownTabOverview;
  isActive: boolean;
  variant: 'primary' | 'emerald';
  className?: string;
}

const TownTabOverviewRow: React.FC<TownTabOverviewRowProps> = ({ overview, isActive, variant, className = '' }) => {
  const panelClass = isActive
    ? variant === 'primary'
      ? 'bg-white/50 border border-primary-100/60'
      : 'bg-white/50 border border-emerald-100/60'
    : 'bg-gray-50 border border-gray-100';

  return (
    <div className={`rounded-lg px-3 py-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600 ${panelClass} ${className}`}>
      <span>
        Mayor{' '}
        <span className="font-medium text-gray-800">{overview.mayorName}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        Tax{' '}
        <span className="font-medium text-gray-800">{overview.taxRate}%</span>
        {overview.taxEnabled !== undefined && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              overview.taxEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {overview.taxEnabled ? 'Active' : 'Disabled'}
          </span>
        )}
      </span>
    </div>
  );
};

interface TownTabSummaryPanelProps {
  summary: TownTabSummary;
  isActive: boolean;
  variant: 'primary' | 'emerald';
}

const TownTabSummaryPanel: React.FC<TownTabSummaryPanelProps> = ({ summary, isActive, variant }) => {
  const styles = variantStyles[variant];
  const metricTile = isActive ? styles.metricTile : 'bg-gray-50 border border-gray-100';
  const financePanel = isActive ? styles.financePanel : 'bg-gray-50 border border-gray-100';

  const metrics = [
    {
      value: summary.studentCount,
      label: 'Students',
      detail: `${summary.employedCount} employed`,
    },
    {
      value: `${summary.employmentPercent}%`,
      label: 'Employment',
      detail: summary.unemployedCount === 1 ? '1 unemployed' : `${summary.unemployedCount} unemployed`,
    },
    {
      value: summary.activeLoans,
      label: 'Loans',
      detail: summary.pendingLoansLabel,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-lg px-2 py-2.5 text-center min-w-0 ${metricTile}`}>
            <p className="text-base sm:text-lg font-bold text-gray-900 tabular-nums leading-tight">{metric.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium mt-1">{metric.label}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate" title={String(metric.detail)}>
              {metric.detail}
            </p>
          </div>
        ))}
      </div>

      <div className={`rounded-lg p-3 space-y-2 min-w-0 ${financePanel}`}>
        <div className="flex items-baseline justify-between gap-3 min-w-0">
          <span className="text-xs text-gray-500 shrink-0">Student balances</span>
          <span
            className={`text-sm font-semibold tabular-nums truncate ${
              summary.balanceIsPositive ? 'text-green-700' : 'text-red-600'
            }`}
            title={summary.totalBalanceFormatted}
          >
            {summary.totalBalanceFormatted}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-gray-500 shrink-0">Average per student</span>
          <span className="text-xs font-medium tabular-nums text-gray-600 truncate" title={summary.avgBalanceFormatted}>
            {summary.avgBalanceFormatted}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-gray-200/70 pt-2 min-w-0">
          <span className="text-xs font-medium text-gray-600 shrink-0">Treasury</span>
          <span
            className="text-sm font-bold tabular-nums text-emerald-700 truncate"
            title={summary.treasuryFormatted}
          >
            {summary.treasuryFormatted}
          </span>
        </div>
      </div>
    </div>
  );
};

/** Town selector accordion: 2 cols tablet, 3 cols desktop. Click to expand details. */
const ResponsiveTownTabs: React.FC<ResponsiveTownTabsProps> = ({
  towns,
  activeId,
  onSelect,
  variant = 'primary',
}) => {
  const styles = variantStyles[variant];
  const [allExpanded, setAllExpanded] = useState(false);

  const handleTownPress = (id: string | number) => {
    const wasActive = activeId === id;
    onSelect(id);
    if (allExpanded && wasActive) {
      setAllExpanded(false);
    } else {
      setAllExpanded(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 items-start">
        {towns.map((town) => {
          const isActive = activeId === town.id;
          const hasDetails = Boolean(town.summary || (town.stats && town.stats.length > 0));
          const isExpanded = allExpanded && hasDetails;
          const summaryLine = town.summary
            ? `${town.summary.studentCount} students · ${town.summary.totalBalanceFormatted}`
            : town.classLabel;

          return (
            <div
              key={town.id}
              className={`transition-all w-full min-w-0 ${
                isActive ? styles.active : 'hover:bg-gray-50/80'
              }`}
            >
              <button
                type="button"
                onClick={() => handleTownPress(town.id)}
                className="p-4 sm:p-5 text-left w-full min-w-0"
                aria-expanded={hasDetails ? isExpanded : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isActive ? styles.iconActive : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-bold truncate ${isActive ? styles.titleActive : 'text-gray-900'}`}
                    >
                      {town.townName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{summaryLine}</p>
                  </div>
                  {hasDetails && (
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 space-y-3">
                  {town.overview && (
                    <TownTabOverviewRow
                      overview={town.overview}
                      isActive={isActive}
                      variant={variant}
                    />
                  )}
                  {town.summary ? (
                    <TownTabSummaryPanel summary={town.summary} isActive={isActive} variant={variant} />
                  ) : town.stats && town.stats.length > 0 ? (
                    <ResponsiveStats mobileCols={1}>
                      {town.stats.map((stat) => (
                        <ResponsiveStatItem
                          key={stat.label}
                          label={stat.label}
                          value={stat.value}
                          helper={stat.helper}
                          icon={stat.icon}
                          valueClassName={stat.valueClassName ?? 'text-sm font-semibold text-gray-700'}
                        />
                      ))}
                    </ResponsiveStats>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { TownTabOverviewRow, TownTabSummaryPanel };
export default ResponsiveTownTabs;
