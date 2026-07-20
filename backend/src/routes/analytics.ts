import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { projectAnalytics, globalAnalytics } from '../controllers/analytics';

const router = Router();

router.use(authenticate);

router.get('/global', globalAnalytics);
router.get('/:id', projectAnalytics);

export default router;
