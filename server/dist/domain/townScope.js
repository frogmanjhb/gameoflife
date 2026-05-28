"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTownClass = isTownClass;
exports.resolveViewerTownClass = resolveViewerTownClass;
exports.viewerTownClassError = viewerTownClassError;
function isTownClass(value) {
    return value === '6A' || value === '6B' || value === '6C';
}
function resolveViewerTownClass(user, queryClass) {
    if (!user)
        return null;
    if (user.role === 'student') {
        return isTownClass(user.class) ? user.class : null;
    }
    if (user.role === 'teacher') {
        if (isTownClass(queryClass))
            return queryClass;
        return isTownClass(user.class) ? user.class : null;
    }
    if (isTownClass(queryClass))
        return queryClass;
    return isTownClass(user.class) ? user.class : null;
}
function viewerTownClassError(userRole) {
    if (userRole === 'teacher') {
        return 'Teachers must specify a town class (6A, 6B, or 6C)';
    }
    return 'Town class required to view this town content';
}
//# sourceMappingURL=townScope.js.map