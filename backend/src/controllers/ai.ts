import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { chatWithAI, analyzeProjectData } from '../config/ai';

function handleAIError(err: any, res: Response) {
  const msg = err?.message || '';
  if (msg.includes('429') || msg.includes('quota') || msg.includes('Quota')) {
    return res.status(429).json({ error: 'Límite de la API gratuita alcanzado. Espera un momento y vuelve a intentar.' });
  }
  console.error('AI error:', err);
  return res.status(500).json({ error: 'Error al procesar consulta con IA' });
}

export async function chat(req: AuthRequest, res: Response) {
  try {
    const { message, conversationId, projectContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    let history: { role: string; content: string }[] = [];
    let currentConversationId = conversationId;

    if (currentConversationId) {
      const msgs = await query(
        'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [currentConversationId]
      );
      history = msgs.rows.map((m) => ({ role: m.role, content: m.content }));
    } else {
      const title = message.substring(0, 80);
      const conv = await query(
        'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id',
        [req.userId, title]
      );
      currentConversationId = conv.rows[0].id;
    }

    let contextMessage = message;
    if (projectContext) {
      contextMessage = `Contexto del proyecto: ${JSON.stringify(projectContext)}\n\nConsulta: ${message}`;
    }

    await query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [currentConversationId, 'user', message]
    );

    const aiResponse = await chatWithAI(contextMessage, history);

    await query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [currentConversationId, 'assistant', aiResponse]
    );

    await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [currentConversationId]);

    res.json({
      conversationId: currentConversationId,
      response: aiResponse,
    });
  } catch (err) {
    handleAIError(err, res);
  }
}

export async function analyzeProject(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.params;

    const project = await query(
      'SELECT name, description, location, dimensions FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.userId]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const p = project.rows[0];
    const analysis = await analyzeProjectData({
      projectName: p.name,
      description: p.description || '',
      location: p.location || undefined,
      dimensions: p.dimensions || undefined,
    });

    res.json({ analysis });
  } catch (err) {
    handleAIError(err, res);
  }
}

export async function listConversations(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
       FROM conversations c
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List conversations error:', err);
    res.status(500).json({ error: 'Error al listar conversaciones' });
  }
}

export async function getConversation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const messages = await query(
      'SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(messages.rows);
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'Error al obtener conversación' });
  }
}

export async function deleteConversation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await query('DELETE FROM conversations WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.json({ message: 'Conversación eliminada' });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ error: 'Error al eliminar conversación' });
  }
}
