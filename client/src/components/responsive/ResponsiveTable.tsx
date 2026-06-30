import React from 'react';

interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Shown as card label on mobile. Defaults to header. */
  mobileLabel?: string;
}

interface ResponsiveTableProps<T> {
  columns: ResponsiveTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  className?: string;
}

/** Desktop table; mobile card layout — no horizontal scroll. */
function ResponsiveTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No data',
  className = '',
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-6">{emptyMessage}</p>;
  }

  return (
    <>
      {/* Desktop */}
      <div className={`hidden md:block overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-900 break-words">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div key={rowKey(row)} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            {columns.map((col) => (
              <div key={col.key} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 min-w-0">
                <span className="text-xs font-medium text-gray-500 shrink-0">
                  {col.mobileLabel ?? col.header}
                </span>
                <span className="text-sm text-gray-900 break-words">{col.render(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default ResponsiveTable;
