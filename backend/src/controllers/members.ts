import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

export async function listMembers(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT u.id, u.full_name, u.email, u.role as user_role, u.avatar_url,
              pm.role as member_role, pm.created_at as added_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.created_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List members error:', err);
    res.status(500).json({ error: 'Error al listar miembros' });
  }
}

export async function addMember(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }
    const user = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado con ese email' });
    }
    const invitedUserId = user.rows[0].id;
    await query(
      `INSERT INTO project_members (project_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3`,
      [id, invitedUserId, role || 'editor', req.userId]
    );
    const member = await query(
      `SELECT u.id, u.full_name, u.email, u.role as user_role,
              pm.role as member_role, pm.created_at as added_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [id, invitedUserId]
    );
    res.status(201).json(member.rows[0]);
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Error al agregar miembro' });
  }
}

export async function removeMember(req: AuthRequest, res: Response) {
  try {
    const { id, userId } = req.params;
    await query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ message: 'Miembro eliminado' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Error al eliminar miembro' });
  }
}

export async function sharedProjects(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.description, p.status, p.created_at,
              u.full_name as owner_name
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       JOIN users u ON u.id = p.user_id
       WHERE pm.user_id = $1 AND p.user_id != $1
       ORDER BY pm.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Shared projects error:', err);
    res.status(500).json({ error: 'Error al obtener proyectos compartidos' });
  }
}
