import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { analyzeProjectDimension } from '../controllers/dimensions';

const router = Router();

router.use(authenticate);

router.post('/:id/dimension/:dimension', analyzeProjectDimension);

export default router;
