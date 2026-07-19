import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  register,
  login,
  refreshTokenHandler,
  logout,
  getProfile,
  updatePassword,
  listSessions,
  revokeSession,
  googleAuth,
  googleCallback,
} from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Intenta en 15 minutos.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshTokenHandler);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.put('/password', authenticate, updatePassword);
router.get('/sessions', authenticate, listSessions);
router.delete('/sessions/:sessionId', authenticate, revokeSession);

// OAuth 2.0
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;
