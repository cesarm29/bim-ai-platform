import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  aiAnalyzeProject,
} from '../controllers/projects';

const router = Router();

router.use(authenticate);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/ai-analyze', aiAnalyzeProject);

export default router;
