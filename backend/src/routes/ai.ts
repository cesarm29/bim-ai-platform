import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import {
  chat,
  analyzeProject,
  listConversations,
  getConversation,
  deleteConversation,
} from '../controllers/ai';

const router = Router();

router.use(authenticate);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 4,
  message: { error: 'Demasiadas solicitudes a la IA. Espera un momento antes de continuar.' },
});

router.use(aiLimiter);

router.post('/chat', chat);
router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);
router.post('/analyze-project/:projectId', analyzeProject);

export default router;
