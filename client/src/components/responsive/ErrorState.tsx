import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, className = '' }) => (
  <div className={`bg-red-50 border border-red-200 rounded-xl p-6 text-center ${className}`}>
    <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-500" />
    <p className="text-sm text-red-800">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn-primary mt-4 min-h-[44px]">
        Try again
      </button>
    )}
  </div>
);

export default ErrorState;
