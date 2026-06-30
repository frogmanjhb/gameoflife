import React from 'react';

type GridCols = 1 | 2 | 3 | 4 | 5 | 6;

interface ResponsiveGridProps {
  children: React.ReactNode;
  /** Desktop column count (lg+). Defaults to 4. Use 6 with stats-6 preset via className. */
  cols?: GridCols;
  /** Tablet column count (md). Defaults to 2. */
  mdCols?: GridCols;
  /** Preset layout key overriding cols/mdCols when set. */
  preset?: 'stats-6' | '1-3';
  className?: string;
}

const gridClassMap: Record<string, string> = {
  '2-4': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 [&>*]:min-w-0',
  '2-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 [&>*]:min-w-0',
  '2-2': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 [&>*]:min-w-0',
  '2-5': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 [&>*]:min-w-0',
  '1-3': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 [&>*]:min-w-0',
  '1-4': 'grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-4 [&>*]:min-w-0',
  '1-3-lg': 'grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 [&>*]:min-w-0',
  'stats-6': 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-3 gap-y-2.5 sm:gap-3 md:gap-4 [&>*]:min-w-0',
};

/** Adaptive grid: 1 col mobile, 2 tablet, 3–4 desktop. */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = 4,
  mdCols = 2,
  preset,
  className = '',
}) => {
  if (preset && gridClassMap[preset]) {
    return <div className={`${gridClassMap[preset]} ${className}`}>{children}</div>;
  }
  const key = `${mdCols}-${cols}`;
  const gridClass = gridClassMap[key] ?? gridClassMap['2-4'];
  return <div className={`${gridClass} ${className}`}>{children}</div>;
};

export default ResponsiveGrid;
