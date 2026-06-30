import React from 'react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading…',
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-16 gap-4 ${className}`}>
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

export default LoadingState;
