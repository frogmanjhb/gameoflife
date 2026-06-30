import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-8 text-center ${className}`}>
    {Icon && <Icon className="h-12 w-12 mx-auto mb-4 text-gray-300" />}
    <p className="font-medium text-gray-900">{title}</p>
    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
