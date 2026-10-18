/**
 * CSRF Protection Middleware
 * Validates the x-csrf-token header against the authenticated user's session csrf_secret
 * for state-modifying HTTP methods.
 */
export function verifyCsrf(req, res, next) {
  // Safe HTTP methods do not change state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt unauthenticated onboarding endpoints
  const exemptPaths = ['/api/auth/login', '/api/auth/register'];
  if (exemptPaths.includes(req.path)) {
    return next();
  }

  // If user is authenticated, CSRF token must match
  if (req.session) {
    const headerToken = req.headers['x-csrf-token'];
    if (!headerToken || headerToken !== req.session.csrfSecret) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid or missing CSRF token'
      });
    }
  }

  next();
}
