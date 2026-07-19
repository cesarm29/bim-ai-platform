import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { analyzeProjectData } from '../config/ai';

export async function createProject(req: AuthRequest, res: Response) {
  try {
    const { name, description, location, startDate, endDate, dimensions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nombre del proyecto requerido' });
    }

    const dims = JSON.stringify(dimensions || ['3D', '4D', '5D']);

    const result = await query(
      `INSERT INTO projects (user_id, name, description, location, start_date, end_date, dimensions)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id, name, description, location, status, start_date, end_date, dimensions, created_at`,
      [req.userId, name, description || '', location || '', startDate || null, endDate || null, dims]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
}

export async function listProjects(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.description, p.location, p.status,
              p.start_date, p.end_date, p.dimensions, p.created_at,
              (SELECT COUNT(*) FROM models WHERE project_id = p.id) as model_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
       FROM projects p
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Error al listar proyectos' });
  }
}

export async function getProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT p.*,
              (SELECT json_agg(m.*) FROM models m WHERE m.project_id = p.id) as models,
              (SELECT json_agg(t.* ORDER BY t.created_at DESC) FROM tasks t WHERE t.project_id = p.id) as tasks
       FROM projects p
       WHERE p.id = $1 AND p.user_id = $2`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
}

export async function updateProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, location, status, startDate, endDate, dimensions } = req.body;

    const result = await query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        location = COALESCE($3, location),
        status = COALESCE($4, status),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        dimensions = COALESCE($7::jsonb, dimensions),
        updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [name, description, location, status, startDate, endDate, dimensions ? JSON.stringify(dimensions) : null, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
}

export async function deleteProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json({ message: 'Proyecto eliminado' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
}

export async function aiAnalyzeProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const project = await query(
      'SELECT name, description, location, dimensions FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const p = project.rows[0];
    const analysis = await analyzeProjectData({
      projectName: p.name,
      description: p.description || '',
      location: p.location || undefined,
      dimensions: p.dimensions,
    });

    res.json({ analysis });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'Error al analizar proyecto con IA' });
  }
}
