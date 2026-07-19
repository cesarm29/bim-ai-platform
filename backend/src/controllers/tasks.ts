import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const { projectId, name, description, priority, startDate, endDate, assignedTo, estimatedHours, phase } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({ error: 'projectId y name requeridos' });
    }

    const result = await query(
      `INSERT INTO tasks (project_id, name, description, priority, start_date, end_date, assigned_to, estimated_hours, phase)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [projectId, name, description || '', priority || 'medium', startDate || null, endDate || null, assignedTo || null, estimatedHours || null, phase || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
}

export async function listTasks(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.params;
    const result = await query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: 'Error al listar tareas' });
  }
}

export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, status, priority, startDate, endDate, assignedTo, estimatedHours, actualHours, phase } = req.body;

    const result = await query(
      `UPDATE tasks SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        assigned_to = COALESCE($7, assigned_to),
        estimated_hours = COALESCE($8, estimated_hours),
        actual_hours = COALESCE($9, actual_hours),
        phase = COALESCE($10, phase),
        updated_at = NOW()
       WHERE id = $11 RETURNING *`,
      [name, description, status, priority, startDate, endDate, assignedTo, estimatedHours, actualHours, phase, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
}

export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json({ message: 'Tarea eliminada' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
}
