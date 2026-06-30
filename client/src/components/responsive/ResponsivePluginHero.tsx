import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, X } from 'lucide-react';
import { ResponsiveHero, ResponsiveHeroContent, ResponsiveHeroAside } from './ResponsiveHero';

interface ResponsivePluginHeroProps {
  title: string;
  subtitle?: React.ReactNode;
  emoji?: string;
  icon?: LucideIcon;
  gradientClass?: string;
  actions?: React.ReactNode;
  /** Show X button to return to dashboard. Defaults to true. */
  showBack?: boolean;
  /** Back link target. Defaults to Town Hub dashboard. */
  backTo?: string;
}

/** Standard plugin page header — stacks on mobile, with close/back control. */
const ResponsivePluginHero: React.FC<ResponsivePluginHeroProps> = ({
  title,
  subtitle,
  emoji,
  icon: Icon,
  gradientClass = 'bg-gradient-to-r from-primary-600 to-primary-700 text-white',
  actions,
  showBack = true,
  backTo = '/',
}) => (
  <ResponsiveHero className={`relative ${gradientClass} shadow-sm`}>
    {showBack && (
      <Link
        to={backTo}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
        aria-label="Back to Town Hub"
      >
        <X className="h-6 w-6" />
      </Link>
    )}
    <ResponsiveHeroContent>
      <div className={`flex items-start gap-3 min-w-0 flex-1 ${showBack ? 'pr-12 sm:pr-14' : ''}`}>
        {emoji && <span className="text-3xl sm:text-4xl shrink-0">{emoji}</span>}
        {Icon && !emoji && (
          <div className="bg-white/20 p-3 rounded-xl shrink-0">
            <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold break-words">{title}</h1>
          {subtitle && <p className="text-sm opacity-90 mt-1 break-words">{subtitle}</p>}
        </div>
      </div>
      {actions && <ResponsiveHeroAside>{actions}</ResponsiveHeroAside>}
    </ResponsiveHeroContent>
  </ResponsiveHero>
);

export default ResponsivePluginHero;
