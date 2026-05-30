import React from 'react';
import { TownNewsStory, TownNewsWidgets } from '../types';
import {
  accentBarClassName,
  badgeClassName,
  badgeLabel,
  headlineStyleClassName,
  hasWidgets,
} from '../utils/townNewsWidgets';

export interface TownNewsStoryCardProps {
  headline: string;
  body: string;
  image_data?: string | null;
  widgets?: TownNewsWidgets | null;
  journalist_name?: string;
  created_at?: string;
  compact?: boolean;
}

const TownNewsStoryCard: React.FC<TownNewsStoryCardProps> = ({
  headline,
  body,
  image_data,
  widgets,
  journalist_name,
  created_at,
  compact = false,
}) => {
  const showMeta = journalist_name || created_at;
  const style = widgets?.headline_style ?? 'classic';

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {widgets?.accent && <div className={`h-1.5 w-full ${accentBarClassName(widgets.accent)}`} />}
      {image_data && (
        <img
          src={image_data}
          alt={headline}
          className={`w-full object-cover bg-gray-100 ${compact ? 'max-h-40' : 'max-h-80'}`}
        />
      )}
      <div className={compact ? 'p-4' : 'p-6'}>
        {(widgets?.badge || (widgets?.emojis && widgets.emojis.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {widgets.badge && (
              <span
                className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded ${badgeClassName(widgets.badge)}`}
              >
                {badgeLabel(widgets.badge)}
              </span>
            )}
            {widgets.emojis && widgets.emojis.length > 0 && (
              <span className="text-lg leading-none" aria-label="Story emojis">
                {widgets.emojis.join(' ')}
              </span>
            )}
          </div>
        )}
        <h2 className={`mb-2 ${headlineStyleClassName(style)}`}>{headline}</h2>
        {showMeta && (
          <p className="text-sm text-gray-500 mb-3">
            {journalist_name && <span>By {journalist_name}</span>}
            {journalist_name && created_at && <span> · </span>}
            {created_at && <span>{new Date(created_at).toLocaleString()}</span>}
          </p>
        )}
        <div className={`text-gray-700 whitespace-pre-wrap leading-relaxed ${compact ? 'text-sm' : ''}`}>
          {body}
        </div>
      </div>
    </article>
  );
};

export function storyToCardProps(story: TownNewsStory, options?: { compact?: boolean }): TownNewsStoryCardProps {
  return {
    headline: story.headline,
    body: story.body,
    image_data: story.image_data,
    widgets: story.widgets,
    journalist_name: story.journalist_name,
    created_at: story.created_at,
    compact: options?.compact,
  };
}

export { hasWidgets };
export default TownNewsStoryCard;
