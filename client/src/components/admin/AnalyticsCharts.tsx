import React from 'react';

interface Analytics {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  transaction_volume_30d: number;
  growth_trends: Array<{ date: string; new_schools: number }>;
}

interface AnalyticsChartsProps {
  analytics: Analytics;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* Growth Trends */}
      {analytics.growth_trends && analytics.growth_trends.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends (Last 90 Days)</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              {analytics.growth_trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{trend.date}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(trend.new_schools / Math.max(...analytics.growth_trends.map(t => t.new_schools))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {trend.new_schools}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{analytics.total_schools}</p>
          <p className="text-sm text-gray-600 mt-1">Schools</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{analytics.total_students.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">Students</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{analytics.total_teachers}</p>
          <p className="text-sm text-gray-600 mt-1">Teachers</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">{analytics.transaction_volume_30d.toLocaleString()}</p>
          <p className="text-sm text-gray-600 mt-1">Transactions (30d)</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
