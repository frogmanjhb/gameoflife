import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RequireRulesAgreedProps {
  children: React.ReactNode;
}

/**
 * For students: redirect to /town-rules if they have not agreed to the app rules.
 * Teachers and super_admins bypass this check.
 * The town-rules route is always accessible (gateway to sign).
 */
const RequireRulesAgreed: React.FC<RequireRulesAgreedProps> = ({ children }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;

  const isStudent = user.role === 'student';
  const hasAgreedToRules = !!user.rules_agreed_at;
  const isRulesRoute = pathname === '/town-rules';

  if (isStudent && !hasAgreedToRules && !isRulesRoute) {
    return <Navigate to="/town-rules" replace />;
  }

  return <>{children}</>;
};

export default RequireRulesAgreed;
