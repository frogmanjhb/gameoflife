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
      className={`block bg-white rounded-xl shadow-sm border p-6 transition-all transform hover:scale-105 ${attentionClass}`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">
            {plugin.icon || '🔌'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{plugin.name}</h3>
          {plugin.description && (
            <p className="text-sm text-gray-500 line-clamp-2">{plugin.description}</p>
          )}
        </div>
        <div className="flex-shrink-0">
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
    </Link>
  );
};

export default PluginCard;

