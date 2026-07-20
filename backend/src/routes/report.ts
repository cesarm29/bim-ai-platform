import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { generateReport } from '../controllers/report';

const router = Router();

router.use(authenticate);

router.get('/:id', generateReport);

export default router;
