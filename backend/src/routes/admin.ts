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

router.get('/migrate', authenticate, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    await query(`CREATE TABLE IF NOT EXISTS project_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL DEFAULT 'editor',
      invited_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(project_id, user_id)
    )`);
    await query(`ALTER TABLE models ADD COLUMN IF NOT EXISTS file_content TEXT`);
    res.json({ message: 'Migration completed' });
  } catch (err: any) {
    res.status(500).json({ error: 'Migration failed', detail: err.message });
  }
});

export default router;
