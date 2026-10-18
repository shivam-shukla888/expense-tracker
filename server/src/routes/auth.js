import { Router } from 'express';
import { AuthService } from '../services/authService.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/env.js';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: config.sessionMaxAgeMs
};

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validate(registerSchema, 'body'),
  async (req, res, next) => {
    try {
      const { user, session } = await AuthService.registerUser(req.body);

      res.cookie(config.cookieName, session.sid, COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user,
        csrfToken: session.csrfSecret
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema, 'body'),
  async (req, res, next) => {
    try {
      const { user, session } = await AuthService.loginUser(req.body);

      res.cookie(config.cookieName, session.sid, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        user,
        csrfToken: session.csrfSecret
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const sid = req.cookies?.[config.cookieName] || req.headers['x-session-id'];
  if (sid) {
    AuthService.logoutUser(sid);
  }

  res.clearCookie(config.cookieName, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    path: '/'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
    csrfToken: req.session.csrfSecret
  });
});

export default router;
