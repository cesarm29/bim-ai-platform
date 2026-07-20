import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

export async function projectAnalytics(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const tasks = await query(
      `SELECT COUNT(*)::int as total,
              COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
              COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
              COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
              COALESCE(SUM(estimated_hours), 0)::float as total_estimated_hours,
              COALESCE(SUM(actual_hours), 0)::float as total_actual_hours
       FROM tasks WHERE project_id = $1`,
      [id]
    );
    const byDimension = await query(
      `SELECT COALESCE(dimension, 'sin_dimension') as dimension,
              COUNT(*)::int as count,
              COALESCE(SUM(estimated_hours), 0)::float as total_hours
       FROM tasks WHERE project_id = $1
       GROUP BY dimension
       ORDER BY count DESC`,
      [id]
    );
    const byPriority = await query(
      `SELECT priority, COUNT(*)::int as count
       FROM tasks WHERE project_id = $1
       GROUP BY priority
       ORDER BY count DESC`,
      [id]
    );
    const byPhase = await query(
      `SELECT COALESCE(phase, 'sin_fase') as phase,
              COUNT(*)::int as count,
              COALESCE(SUM(estimated_hours), 0)::float as total_hours
       FROM tasks WHERE project_id = $1
       GROUP BY phase
       ORDER BY count DESC`,
      [id]
    );
    const models = await query(
      `SELECT COUNT(*)::int as total_models,
              COALESCE(SUM(file_size), 0)::bigint as total_size_bytes
       FROM models WHERE project_id = $1`,
      [id]
    );
    const members = await query(
      `SELECT COUNT(*)::int as total_members FROM project_members WHERE project_id = $1`,
      [id]
    );
    res.json({
      tasks: tasks.rows[0],
      byDimension: byDimension.rows,
      byPriority: byPriority.rows,
      byPhase: byPhase.rows,
      models: models.rows[0],
      members: members.rows[0],
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Error al obtener analytics' });
  }
}

export async function globalAnalytics(req: AuthRequest, res: Response) {
  try {
    const projects = await query(
      `SELECT COUNT(*)::int as total_projects,
              COUNT(*) FILTER (WHERE status = 'planning')::int as planning,
              COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
              COUNT(*) FILTER (WHERE status = 'completed')::int as completed
       FROM projects WHERE user_id = $1`,
      [req.userId]
    );
    const tasks = await query(
      `SELECT COUNT(*)::int as total_tasks,
              COUNT(*) FILTER (WHERE t.status = 'completed')::int as completed,
              COUNT(*) FILTER (WHERE t.status = 'in_progress')::int as in_progress,
              COUNT(*) FILTER (WHERE t.status = 'pending')::int as pending
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE p.user_id = $1`,
      [req.userId]
    );
    const byDimension = await query(
      `SELECT COALESCE(t.dimension, 'sin_dimension') as dimension,
              COUNT(*)::int as count
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE p.user_id = $1
       GROUP BY t.dimension
       ORDER BY count DESC`,
      [req.userId]
    );
    const recentProjects = await query(
      `SELECT id, name, status, created_at
       FROM projects WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [req.userId]
    );
    res.json({
      projects: projects.rows[0],
      tasks: tasks.rows[0],
      byDimension: byDimension.rows,
      recentProjects: recentProjects.rows,
    });
  } catch (err) {
    console.error('Global analytics error:', err);
    res.status(500).json({ error: 'Error al obtener analytics globales' });
  }
}
