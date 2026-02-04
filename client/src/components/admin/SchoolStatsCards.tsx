import React from 'react';
import { Building2, Users, GraduationCap, TrendingUp } from 'lucide-react';

interface Analytics {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  transaction_volume_30d: number;
}

interface SchoolStatsCardsProps {
  analytics: Analytics;
}

const SchoolStatsCards: React.FC<SchoolStatsCardsProps> = ({ analytics }) => {
  const cards = [
    {
      title: 'Total Schools',
      value: analytics.total_schools,
      icon: Building2,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Students',
      value: analytics.total_students.toLocaleString(),
      icon: GraduationCap,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Teachers',
      value: analytics.total_teachers,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Transactions (30d)',
      value: analytics.transaction_volume_30d.toLocaleString(),
      icon: TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} rounded-xl shadow-sm border border-gray-200 p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SchoolStatsCards;
