import React from 'react';

interface ProfileBadgeProps {
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    profile_emoji?: string;
  } | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProfileBadge: React.FC<ProfileBadgeProps> = ({ user, size = 'md', className = '' }) => {
  if (!user) return null;

  // Get initials
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const emojiSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold ${className}`}
      style={user.profile_emoji ? {} : { backgroundColor: '#9CA3AF', color: 'white' }}
    >
      {user.profile_emoji ? (
        <span className={emojiSizeClasses[size]}>{user.profile_emoji}</span>
      ) : (
        <span>{getInitials()}</span>
      )}
    </div>
  );
};

export default ProfileBadge;
