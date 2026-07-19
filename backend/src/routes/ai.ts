import { Router } from 'express';
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

router.post('/chat', chat);
router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);
router.post('/analyze-project/:projectId', analyzeProject);

export default router;
