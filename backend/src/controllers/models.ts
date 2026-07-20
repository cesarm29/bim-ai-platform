import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.ifc', '.rvt', '.rfa', '.dwg', '.dxf', '.obj', '.fbx', '.3ds'];
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Formatos: ' + allowed.join(', ')));
    }
  },
});

export const uploadMiddleware = upload.single('file');

export async function uploadModel(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo requerido' });
    }
    const content = req.file.buffer.toString('base64');
    const result = await query(
      `INSERT INTO models (project_id, name, file_path, file_size, file_type, file_content, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id, name, file_size, file_type, created_at`,
      [id, req.file.originalname, '', req.file.size, req.file.mimetype, content, JSON.stringify({ uploadedBy: req.userId })]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Upload model error:', err);
    res.status(500).json({ error: 'Error al subir modelo' });
  }
}

export async function listModels(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, name, file_size, file_type, created_at
       FROM models WHERE project_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List models error:', err);
    res.status(500).json({ error: 'Error al listar modelos' });
  }
}

export async function deleteModel(req: AuthRequest, res: Response) {
  try {
    const { modelId } = req.params;
    await query('DELETE FROM models WHERE id = $1', [modelId]);
    res.json({ message: 'Modelo eliminado' });
  } catch (err) {
    console.error('Delete model error:', err);
    res.status(500).json({ error: 'Error al eliminar modelo' });
  }
}

export async function getModelContent(req: AuthRequest, res: Response) {
  try {
    const { modelId } = req.params;
    const result = await query(
      'SELECT name, file_type, file_content FROM models WHERE id = $1',
      [modelId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Modelo no encontrado' });
    }
    const model = result.rows[0];
    res.json({
      name: model.name,
      file_type: model.file_type,
      content: model.file_content,
    });
  } catch (err) {
    console.error('Get model content error:', err);
    res.status(500).json({ error: 'Error al obtener contenido del modelo' });
  }
}
