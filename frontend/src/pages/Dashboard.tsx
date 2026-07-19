import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Calendar, MapPin, Trash2, Sparkles } from 'lucide-react';
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

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', location: '', startDate: '', endDate: '', dimensions: ['3D', '4D', '5D'] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Proyectos</h1>
          <p className="text-gray-500 mt-1">Gestiona tus proyectos BIM con IA</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nuevo Proyecto
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Nuevo Proyecto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Nombre del proyecto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Breve descripción del proyecto"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={newProject.location}
                  onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ciudad, país"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin estimado</label>
                  <input
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dimensiones BIM</label>
                <div className="flex flex-wrap gap-2">
                  {DIMENSIONS.map((dim) => {
                    const active = newProject.dimensions.includes(dim.id);
                    return (
                      <button
                        key={dim.id}
                        type="button"
                        onClick={() => setNewProject({
                          ...newProject,
                          dimensions: active
                            ? newProject.dimensions.filter((d) => d !== dim.id)
                            : [...newProject.dimensions, dim.id],
                        })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          active
                            ? dimColors[dim.id] + ' ring-2 ring-offset-1'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                        title={dim.desc}
                      >
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
            <div
              key={project.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabels[project.status] || project.status}
                </span>
                {project.location && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.location}
                  </span>
                )}
              </div>

              {project.dimensions && project.dimensions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.dimensions.map((dim) => (
                    <span key={dim} className={`text-xs font-medium px-2 py-0.5 rounded border ${dimColors[dim] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {dim}
                    </span>
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

              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
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
