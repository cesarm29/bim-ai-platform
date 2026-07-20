import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

export async function generateReport(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const project = await query(
      `SELECT p.*,
              u.full_name as owner_name, u.email as owner_email
       FROM projects p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.user_id = $2`,
      [id, req.userId]
    );
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    const p = project.rows[0];
    const tasks = await query(
      `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    const analytics = await query(
      `SELECT COUNT(*)::int as total,
              COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
              COUNT(*) FILTER (WHERE status = 'in_progress')::int as in_progress,
              COUNT(*) FILTER (WHERE status = 'pending')::int as pending
       FROM tasks WHERE project_id = $1`,
      [id]
    );
    const a = analytics.rows[0];
    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${p.name} - Reporte BIM</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1f2937; }
  h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
  h2 { color: #374151; margin-top: 30px; }
  .meta { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; }
  .meta-item { font-size: 14px; color: #6b7280; }
  .meta-item strong { color: #374151; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
  .stat { padding: 15px; background: #eff6ff; border-radius: 8px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
  .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #2563eb; color: white; padding: 10px; text-align: left; font-size: 13px; }
  td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  tr:hover { background: #f9fafb; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
  .completed { background: #d1fae5; color: #065f46; }
  .in_progress { background: #dbeafe; color: #1e40af; }
  .pending { background: #fef3c7; color: #92400e; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
</style></head>
<body>
  <h1>${p.name}</h1>
  <p style="color:#6b7280;margin-top:-5px">Reporte generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <div class="meta">
    <div class="meta-item"><strong>Ubicación:</strong> ${p.location || 'No especificada'}</div>
    <div class="meta-item"><strong>Estado:</strong> ${p.status}</div>
    <div class="meta-item"><strong>Inicio:</strong> ${p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</div>
    <div class="meta-item"><strong>Fin:</strong> ${p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}</div>
    <div class="meta-item"><strong>Propietario:</strong> ${p.owner_name} (${p.owner_email})</div>
    <div class="meta-item"><strong>Dimensiones:</strong> ${(p.dimensions || []).join(', ')}</div>
  </div>
  <h2>Resumen del Proyecto</h2>
  <p>${p.description || 'Sin descripción'}</p>
  <div class="stats">
    <div class="stat"><div class="stat-value">${a.total}</div><div class="stat-label">Total Tareas</div></div>
    <div class="stat"><div class="stat-value" style="color:#059669">${a.completed}</div><div class="stat-label">Completadas</div></div>
    <div class="stat"><div class="stat-value" style="color:#2563eb">${a.in_progress}</div><div class="stat-label">En Progreso</div></div>
    <div class="stat"><div class="stat-value" style="color:#d97706">${a.pending}</div><div class="stat-label">Pendientes</div></div>
  </div>
  <h2>Tareas (${tasks.rows.length})</h2>
  <table>
    <tr><th>Nombre</th><th>Estado</th><th>Prioridad</th><th>Dimensión</th><th>Horas Est.</th><th>Fase</th></tr>
    ${tasks.rows.map((t: any) => `<tr>
      <td>${t.name}</td>
      <td><span class="badge ${t.status}">${t.status}</span></td>
      <td>${t.priority}</td>
      <td>${t.dimension || '—'}</td>
      <td>${t.estimated_hours || '—'}</td>
      <td>${t.phase || '—'}</td>
    </tr>`).join('')}
  </table>
  <div class="footer">
    <p>BIM AI Platform — Reporte generado automáticamente</p>
    <p>${new Date().toISOString()}</p>
  </div>
</body></html>`;
    res.json({ html, project: p, tasks: tasks.rows, analytics: a });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
}
