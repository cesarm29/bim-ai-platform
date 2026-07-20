import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Calendar, MapPin, Trash2, Sparkles, BarChart3, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users, Box, Timer, DollarSign, Leaf, Building2 } from 'lucide-react';
import api from '../services/api';

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  dimensions: string[];
  model_count: number;
  task_count: number;
  owner_name?: string;
}

interface GlobalAnalytics {
  projects: { total_projects: number; planning: number; in_progress: number; completed: number };
  tasks: { total_tasks: number; completed: number; in_progress: number; pending: number };
  byDimension: { dimension: string; count: number }[];
  recentProjects: { id: string; name: string; status: string; created_at: string }[];
}

const DIMENSIONS = [
  { id: '3D', label: '3D', desc: 'Modelo Geométrico', color: 'blue' },
  { id: '4D', label: '4D', desc: 'Tiempo', color: 'green' },
  { id: '5D', label: '5D', desc: 'Costos', color: 'orange' },
  { id: '6D', label: '6D', desc: 'Sostenibilidad', color: 'emerald' },
  { id: '7D', label: '7D', desc: 'Ciclo de Vida', color: 'purple' },
];

const dimColors: Record<string, string> = {
  '3D': 'bg-blue-100 text-blue-700 border-blue-200',
  '4D': 'bg-green-100 text-green-700 border-green-200',
  '5D': 'bg-orange-100 text-orange-700 border-orange-200',
  '6D': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '7D': 'bg-purple-100 text-purple-700 border-purple-200',
};

const dimChartColors: Record<string, string> = {
  '3D': '#3b82f6', '4D': '#22c55e', '5D': '#f97316',
  '6D': '#10b981', '7D': '#a855f7', 'sin_dimension': '#9ca3af',
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', location: '', startDate: '', endDate: '', dimensions: ['3D', '4D', '5D'] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [projRes, analRes] = await Promise.all([
        api.get('/projects'),
        api.get('/analytics/global'),
      ]);
      setProjects(projRes.data);
      setAnalytics(analRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const createProject = async () => {
    try {
      const res = await api.post('/projects', newProject);
      setProjects([res.data, ...projects]);
      setShowCreate(false);
      setNewProject({ name: '', description: '', location: '', startDate: '', endDate: '', dimensions: ['3D', '4D', '5D'] });
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    on_hold: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    planning: 'Planificación',
    in_progress: 'En Progreso',
    completed: 'Completado',
    on_hold: 'En Pausa',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const a = analytics;
  const maxDimCount = a?.byDimension?.length ? Math.max(...a.byDimension.map(d => d.count), 1) : 1;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Panel BIM</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Dashboard analítico de proyectos</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          Nuevo Proyecto
        </button>
      </div>

      {a && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Proyectos</span>
                <FolderOpen className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{a.projects.total_projects}</span>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span>{a.projects.planning} planif.</span>
                <span>{a.projects.in_progress} activos</span>
                <span>{a.projects.completed} comp.</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Tareas Totales</span>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{a.tasks.total_tasks}</span>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span className="text-green-600">{a.tasks.completed} comp.</span>
                <span className="text-blue-600">{a.tasks.in_progress} activas</span>
                <span className="text-yellow-600">{a.tasks.pending} pend.</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Avance</span>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {a.tasks.total_tasks > 0 ? Math.round(a.tasks.completed / a.tasks.total_tasks * 100) : 0}%
              </span>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${a.tasks.total_tasks > 0 ? a.tasks.completed / a.tasks.total_tasks * 100 : 0}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Rendimiento</span>
                <BarChart3 className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {a.tasks.total_tasks > 0 ? Math.round((a.tasks.completed + a.tasks.in_progress) / a.tasks.total_tasks * 100) : 0}%
              </span>
              <p className="text-xs text-gray-400 mt-2">Completadas + En progreso</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Tareas por Dimensión BIM</h3>
              {a.byDimension.length === 0 ? (
                <p className="text-sm text-gray-400">Sin tareas asignadas a dimensiones</p>
              ) : (
                <div className="space-y-3">
                  {a.byDimension.map((d) => {
                    const pct = (d.count / maxDimCount) * 100;
                    const color = dimChartColors[d.dimension] || '#9ca3af';
                    return (
                      <div key={d.dimension}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium">{d.dimension === 'sin_dimension' ? 'Sin dimensión' : d.dimension}</span>
                          <span className="text-gray-500">{d.count} tareas</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Estado de Tareas</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-600 font-medium">Completadas</span>
                    <span className="text-gray-500">{a.tasks.completed}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${a.tasks.total_tasks > 0 ? a.tasks.completed / a.tasks.total_tasks * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-600 font-medium">En Progreso</span>
                    <span className="text-gray-500">{a.tasks.in_progress}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${a.tasks.total_tasks > 0 ? a.tasks.in_progress / a.tasks.total_tasks * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-yellow-600 font-medium">Pendientes</span>
                    <span className="text-gray-500">{a.tasks.pending}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-yellow-500 h-3 rounded-full transition-all" style={{ width: `${a.tasks.total_tasks > 0 ? a.tasks.pending / a.tasks.total_tasks * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Proyectos Recientes</h3>
              {a.recentProjects.length === 0 ? (
                <p className="text-sm text-gray-400">No hay proyectos aún</p>
              ) : (
                <div className="space-y-3">
                  {a.recentProjects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                      <span className="text-sm font-medium text-gray-700 truncate">{p.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[p.status] || p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-6">Nuevo Proyecto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Nombre del proyecto" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Breve descripción del proyecto" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input type="text" value={newProject.location} onChange={(e) => setNewProject({ ...newProject, location: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Ciudad, país" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                  <input type="date" value={newProject.startDate} onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin estimado</label>
                  <input type="date" value={newProject.endDate} onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dimensiones BIM</label>
                <div className="flex flex-wrap gap-2">
                  {DIMENSIONS.map((dim) => {
                    const active = newProject.dimensions.includes(dim.id);
                    return (
                      <button key={dim.id} type="button" onClick={() => setNewProject({ ...newProject, dimensions: active ? newProject.dimensions.filter((d) => d !== dim.id) : [...newProject.dimensions, dim.id] })} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${active ? dimColors[dim.id] + ' ring-2 ring-offset-1' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`} title={dim.desc}>
                        {dim.label} {dim.desc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={createProject} disabled={!newProject.name} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Crear</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Mis Proyectos</h2>
        <span className="text-sm text-gray-500">{projects.length} proyectos</span>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">No hay proyectos aún</h2>
          <p className="text-gray-400 mb-6">Crea tu primer proyecto BIM para empezar</p>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <Plus className="h-5 w-5" />
            Crear Proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">{project.name}</h3>
                  {project.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="p-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabels[project.status] || project.status}
                </span>
                {project.location && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>}
              </div>
              {project.dimensions && project.dimensions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.dimensions.map((dim) => (
                    <span key={dim} className={`text-xs font-medium px-2 py-0.5 rounded border ${dimColors[dim] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{dim}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{project.model_count || 0} modelos</span>
                <span>{project.task_count || 0} tareas</span>
              </div>
              {project.start_date && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-3">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.start_date).toLocaleDateString()}
                  {project.end_date && ` → ${new Date(project.end_date).toLocaleDateString()}`}
                </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <Sparkles className="h-4 w-4" />
                Analizar con IA
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
