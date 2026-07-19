import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { analyzeDimension } from '../config/ai';

function handleAIError(err: any, res: Response) {
  const msg = err?.message || '';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('Quota')) {
    return res.status(429).json({ error: 'Límite de la API gratuita alcanzado. Espera un momento y vuelve a intentar.' });
  }
  console.error('Dimension AI error:', err);
  return res.status(500).json({ error: 'Error al analizar con IA' });
}

export async function analyzeProjectDimension(req: AuthRequest, res: Response) {
  try {
    const { id, dimension } = req.params;
    const validDimensions = ['3D', '4D', '5D', '6D', '7D'];
    if (!validDimensions.includes(dimension)) {
      return res.status(400).json({ error: `Dimensión no válida. Use: ${validDimensions.join(', ')}` });
    }

    const project = await query(
      'SELECT name, description, location, dimensions FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const p = project.rows[0];

    const tasks = await query(
      'SELECT name, status, priority, dimension, estimated_hours, start_date, phase FROM tasks WHERE project_id = $1 ORDER BY created_at',
      [id]
    );

    const analysis = await analyzeDimension(dimension, {
      projectName: p.name,
      description: p.description || '',
      location: p.location || undefined,
      dimensions: p.dimensions,
      tasks: tasks.rows,
    });

    res.json({ dimension, analysis });
  } catch (err) {
    handleAIError(err, res);
  }
}
