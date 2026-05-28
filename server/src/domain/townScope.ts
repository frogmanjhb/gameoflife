export type TownClass = '6A' | '6B' | '6C';

export function isTownClass(value: unknown): value is TownClass {
  return value === '6A' || value === '6B' || value === '6C';
}

export function resolveViewerTownClass(
  user: { role?: string; class?: string | null } | null | undefined,
  queryClass: unknown
): TownClass | null {
  if (!user) return null;

  if (user.role === 'student') {
    return isTownClass(user.class) ? user.class : null;
  }

  if (user.role === 'teacher') {
    if (isTownClass(queryClass)) return queryClass;
    return isTownClass(user.class) ? user.class : null;
  }

  if (isTownClass(queryClass)) return queryClass;
  return isTownClass(user.class) ? user.class : null;
}

export function viewerTownClassError(userRole: string | undefined): string {
  if (userRole === 'teacher') {
    return 'Teachers must specify a town class (6A, 6B, or 6C)';
  }
  return 'Town class required to view this town content';
}
