import React from 'react';
import { Link } from 'react-router-dom';
import { Plugin } from '../types';

interface PluginCardProps {
  plugin: Plugin;
  needsAttention?: boolean;
  needsVote?: boolean;
}

const PluginCard: React.FC<PluginCardProps> = ({ plugin, needsAttention, needsVote }) => {
  const attentionClass = needsVote
    ? 'border-red-400 vote-attention hover:border-red-500 hover:shadow-lg'
    : needsAttention
      ? 'border-amber-400 bank-attention hover:border-amber-500 hover:shadow-lg'
      : 'border-gray-200 hover:shadow-md hover:border-primary-300';

  return (
    <Link
      to={plugin.route_path}
      className={`block bg-white rounded-xl shadow-sm border p-4 sm:p-5 transition-all transform hover:scale-105 ${attentionClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-11 h-11 bg-primary-100 rounded-lg flex items-center justify-center text-xl">
            {plugin.icon || '🔌'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 leading-snug break-words">{plugin.name}</h3>
          <div className="mt-2">
            {needsVote ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Vote now
              </span>
            ) : needsAttention ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Needs attention
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                Active
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PluginCard;

