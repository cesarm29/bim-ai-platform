import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listMembers, addMember, removeMember, sharedProjects } from '../controllers/members';

const router = Router();

router.use(authenticate);

router.get('/shared', sharedProjects);
router.get('/:id/members', listMembers);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
