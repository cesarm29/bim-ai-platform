import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles, MessageSquare, Calendar, Clock, Trash2, CheckCircle2, Circle, Box, Timer, DollarSign, Leaf, Building2 } from 'lucide-react';
import api from '../services/api';

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  phase: string;
  dimension: string;
  start_date: string;
  end_date: string;
  assigned_to: string;
  estimated_hours: number;
  actual_hours: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  status: string;
  start_date: string;
  end_date: string;
  dimensions: string[];
  tasks: Task[];
}

const DIMENSION_INFO: Record<string, { label: string; desc: string; icon: any; color: string; bg: string; cardBg: string }> = {
  '3D': { label: '3D', desc: 'Modelo Geométrico', icon: Box, color: 'text-blue-700', bg: 'bg-blue-100', cardBg: 'bg-blue-50 border-blue-200' },
  '4D': { label: '4D', desc: 'Tiempo', icon: Timer, color: 'text-green-700', bg: 'bg-green-100', cardBg: 'bg-green-50 border-green-200' },
  '5D': { label: '5D', desc: 'Costos', icon: DollarSign, color: 'text-orange-700', bg: 'bg-orange-100', cardBg: 'bg-orange-50 border-orange-200' },
  '6D': { label: '6D', desc: 'Sostenibilidad', icon: Leaf, color: 'text-emerald-700', bg: 'bg-emerald-100', cardBg: 'bg-emerald-50 border-emerald-200' },
  '7D': { label: '7D', desc: 'Ciclo de Vida', icon: Building2, color: 'text-purple-700', bg: 'bg-purple-100', cardBg: 'bg-purple-50 border-purple-200' },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', description: '', priority: 'medium', phase: '', dimension: '', startDate: '', endDate: '', estimatedHours: '' });

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const createTask = async () => {
    if (!newTask.name) return;
    try {
      await api.post('/tasks', { projectId: id, name: newTask.name, description: newTask.description, priority: newTask.priority, phase: newTask.phase, dimension: newTask.dimension || null, startDate: newTask.startDate || null, endDate: newTask.endDate || null, estimatedHours: newTask.estimatedHours ? Number(newTask.estimatedHours) : null });
      setShowTaskForm(false);
      setNewTask({ name: '', description: '', priority: 'medium', phase: '', dimension: '', startDate: '', endDate: '', estimatedHours: '' });
      fetchProject();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchProject();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProject();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    setAiAnalysis('');
    try {
      const res = await api.post(`/projects/${id}/ai-analyze`);
      setAiAnalysis(res.data.analysis);
    } catch (err) {
      setAiAnalysis('Error al analizar con IA. Verifica la configuración de Gemini API.');
    } finally {
      setAnalyzing(false);
    }
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!project) {
    return <div className="text-center py-16 text-gray-500">Proyecto no encontrado</div>;
  }

  return (
    <div>
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Volver a proyectos
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-gray-500 mt-2">{project.description}</p>}
          {project.location && <p className="text-sm text-gray-400 mt-1">📍 {project.location}</p>}
        </div>
        <button onClick={analyzeWithAI} disabled={analyzing} className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
          <Sparkles className={`h-5 w-5 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analizando...' : 'Análisis IA'}
        </button>
      </div>

      {aiAnalysis && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 text-purple-700 font-semibold mb-3">
            <Sparkles className="h-5 w-5" />
            Análisis del Proyecto
          </div>
          <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{aiAnalysis}</div>
        </div>
      )}

      {project.dimensions && project.dimensions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Dimensiones BIM</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {project.dimensions.map((dim) => {
              const info = DIMENSION_INFO[dim];
              if (!info) return null;
              const Icon = info.icon;
              return (
                <div key={dim} className={`${info.cardBg} border rounded-xl p-4 text-center hover:shadow-md transition-shadow`}>
                  <Icon className={`h-8 w-8 ${info.color} mx-auto mb-2`} />
                  <div className={`font-bold text-lg ${info.color}`}>{info.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{info.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Tareas del Proyecto</h2>
        <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Agregar Tarea
        </button>
      </div>

      {showTaskForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre de la tarea" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
              <input type="text" value={newTask.phase} onChange={(e) => setNewTask({ ...newTask, phase: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Diseño, Estructura,..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensión BIM</label>
              <select value={newTask.dimension} onChange={(e) => setNewTask({ ...newTask, dimension: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Sin dimensión</option>
                {project.dimensions?.map((dim) => (
                  <option key={dim} value={dim}>{dim} - {DIMENSION_INFO[dim]?.desc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
              <input type="date" value={newTask.startDate} onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas estimadas</label>
              <input type="number" value={newTask.estimatedHours} onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowTaskForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={createTask} disabled={!newTask.name} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">Guardar</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(!project.tasks || project.tasks.length === 0) ? (
          <div className="text-center py-12 text-gray-400">
            <p>No hay tareas todavía. Agrega la primera tarea del proyecto.</p>
          </div>
        ) : (
          project.tasks.map((task) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <button onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')} className="mt-1 flex-shrink-0">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 hover:text-green-400 transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.name}</h3>
                      {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColors[task.priority] || 'bg-gray-100 text-gray-700'}`}>
                      {task.priority === 'low' ? 'Baja' : task.priority === 'medium' ? 'Media' : task.priority === 'high' ? 'Alta' : 'Crítica'}
                    </span>
                    {task.phase && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{task.phase}</span>}
                    {task.dimension && DIMENSION_INFO[task.dimension] && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${DIMENSION_INFO[task.dimension].color} ${DIMENSION_INFO[task.dimension].bg}`}>
                        {task.dimension}
                      </span>
                    )}
                    {task.start_date && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {task.estimated_hours && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.estimated_hours}h
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
        <button onClick={() => navigate('/ai')} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
          <MessageSquare className="h-5 w-5" />
          Consultar al Asistente IA
        </button>
      </div>
    </div>
  );
}
