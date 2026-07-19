import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createTask, listTasks, updateTask, deleteTask } from '../controllers/tasks';

const router = Router();

router.use(authenticate);

router.post('/', createTask);
router.get('/project/:projectId', listTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
