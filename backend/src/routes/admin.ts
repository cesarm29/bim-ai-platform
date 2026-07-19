import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

router.get('/users', authenticate, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, is_verified, created_at, updated_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

router.patch('/users/:id/role', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'user', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido. Use: admin, user, viewer' });
    }
    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);
    res.json({ message: 'Rol actualizado' });
  } catch (err) {
    console.error('Admin update role error:', err);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

export default router;
