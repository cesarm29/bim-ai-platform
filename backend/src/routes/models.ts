import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listModels, uploadModel, deleteModel, getModelContent, uploadMiddleware } from '../controllers/models';

const router = Router();

router.use(authenticate);

router.get('/:id/models', listModels);
router.post('/:id/models', uploadMiddleware, uploadModel);
router.get('/models/:modelId/content', getModelContent);
router.delete('/models/:modelId', deleteModel);

export default router;
