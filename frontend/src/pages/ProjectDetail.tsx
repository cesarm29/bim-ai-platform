import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles, MessageSquare, Calendar, Clock, Trash2, CheckCircle2, Circle, Box, Timer, DollarSign, Leaf, Building2, Loader2, AlertCircle, Users, Upload, Download, FileText, UserPlus, X, BarChart3, GantChartSquare } from 'lucide-react';
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
  models?: any[];
  owner_name?: string;
  user_id?: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  member_role: string;
  added_at: string;
}

interface ModelFile {
  id: string;
  name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface ProjectAnalytics {
  tasks: { total: number; completed: number; in_progress: number; pending: number; total_estimated_hours: number; total_actual_hours: number };
  byDimension: { dimension: string; count: number; total_hours: number }[];
  byPriority: { priority: string; count: number }[];
  byPhase: { phase: string; count: number; total_hours: number }[];
  models: { total_models: number; total_size_bytes: number };
  members: { total_members: number };
}

const DIMENSION_INFO: Record<string, { label: string; desc: string; icon: any; color: string; bg: string; cardBg: string; border: string; gradient: string }> = {
  '3D': { label: '3D', desc: 'Modelo Geométrico', icon: Box, color: 'text-blue-700', bg: 'bg-blue-100', cardBg: 'bg-blue-50 border-blue-200', border: 'border-blue-300', gradient: 'from-blue-500 to-blue-600' },
  '4D': { label: '4D', desc: 'Tiempo', icon: Timer, color: 'text-green-700', bg: 'bg-green-100', cardBg: 'bg-green-50 border-green-200', border: 'border-green-300', gradient: 'from-green-500 to-green-600' },
  '5D': { label: '5D', desc: 'Costos', icon: DollarSign, color: 'text-orange-700', bg: 'bg-orange-100', cardBg: 'bg-orange-50 border-orange-200', border: 'border-orange-300', gradient: 'from-orange-500 to-orange-600' },
  '6D': { label: '6D', desc: 'Sostenibilidad', icon: Leaf, color: 'text-emerald-700', bg: 'bg-emerald-100', cardBg: 'bg-emerald-50 border-emerald-200', border: 'border-emerald-300', gradient: 'from-emerald-500 to-emerald-600' },
  '7D': { label: '7D', desc: 'Ciclo de Vida', icon: Building2, color: 'text-purple-700', bg: 'bg-purple-100', cardBg: 'bg-purple-50 border-purple-200', border: 'border-purple-300', gradient: 'from-purple-500 to-purple-600' },
};

const dimChartColors: Record<string, string> = {
  '3D': '#3b82f6', '4D': '#22c55e', '5D': '#f97316',
  '6D': '#10b981', '7D': '#a855f7', 'sin_dimension': '#9ca3af',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingDim, setAnalyzingDim] = useState<string | null>(null);
  const [dimResults, setDimResults] = useState<Record<string, string>>({});
  const [dimErrors, setDimErrors] = useState<Record<string, string>>({});
  const [newTask, setNewTask] = useState({ name: '', description: '', priority: 'medium', phase: '', dimension: '', startDate: '', endDate: '', estimatedHours: '' });
  const [members, setMembers] = useState<Member[]>([]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [models, setModels] = useState<ModelFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'gantt' | 'team' | 'models' | 'analytics'>('tasks');

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
      return res.data;
    } catch (err) {
      console.error('Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/analytics/${id}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/projects/${id}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await api.get(`/projects/${id}/models`);
      setModels(res.data);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  useEffect(() => {
    fetchProject().then(() => {
      fetchAnalytics();
      fetchMembers();
      fetchModels();
    });
  }, [id]);

  const createTask = async () => {
    if (!newTask.name) return;
    try {
      await api.post('/tasks', { projectId: id, name: newTask.name, description: newTask.description, priority: newTask.priority, phase: newTask.phase, dimension: newTask.dimension || null, startDate: newTask.startDate || null, endDate: newTask.endDate || null, estimatedHours: newTask.estimatedHours ? Number(newTask.estimatedHours) : null });
      setShowTaskForm(false);
      setNewTask({ name: '', description: '', priority: 'medium', phase: '', dimension: '', startDate: '', endDate: '', estimatedHours: '' });
      fetchProject().then(() => fetchAnalytics());
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      fetchProject().then(() => fetchAnalytics());
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProject().then(() => fetchAnalytics());
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
    } catch (err: any) {
      setAiAnalysis(err?.response?.data?.error || 'Error al analizar con IA');
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeDimension = async (dim: string) => {
    setAnalyzingDim(dim);
    setDimResults((prev) => ({ ...prev, [dim]: '' }));
    setDimErrors((prev) => ({ ...prev, [dim]: '' }));
    try {
      const res = await api.post(`/projects/${id}/dimension/${dim}`);
      setDimResults((prev) => ({ ...prev, [dim]: res.data.analysis }));
    } catch (err: any) {
      setDimErrors((prev) => ({ ...prev, [dim]: err?.response?.data?.error || 'Error al analizar' }));
    } finally {
      setAnalyzingDim(null);
    }
  };

  const addMember = async () => {
    if (!inviteEmail) return;
    try {
      await api.post(`/projects/${id}/members`, { email: inviteEmail, role: inviteRole });
      setShowMemberForm(false);
      setInviteEmail('');
      fetchMembers();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al invitar miembro');
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm('¿Eliminar este miembro del proyecto?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchMembers();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/projects/${id}/models`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchModels();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Error al subir archivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const deleteModel = async (modelId: string) => {
    if (!confirm('¿Eliminar este modelo?')) return;
    try {
      await api.delete(`/models/${modelId}`);
      fetchModels();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const exportReport = async () => {
    try {
      const res = await api.get(`/report/${id}`);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(res.data.html);
        win.document.close();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!project) {
    return <div className="text-center py-16 text-gray-500">Proyecto no encontrado</div>;
  }

  const tasks = project.tasks || [];
  const hasDates = tasks.some(t => t.start_date);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={analyzeWithAI} disabled={analyzing} className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors w-full sm:w-auto">
            <Sparkles className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analizando...' : 'Análisis General'}
          </button>
          <button onClick={exportReport} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Exportar Reporte
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">{project.name}</h1>
        {project.description && <p className="text-gray-500 mt-2 text-sm md:text-base">{project.description}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
          {project.location && <span>{project.location}</span>}
          {project.owner_name && <span>Propietario: {project.owner_name}</span>}
          <span>{tasks.length} tareas</span>
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 text-purple-700 font-semibold mb-3">
            <Sparkles className="h-5 w-5" />
            Análisis General del Proyecto
          </div>
          <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{aiAnalysis}</div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Agentes IA por Dimensión BIM</h2>
        <p className="text-gray-500 text-xs md:text-sm mb-4">Cada agente analiza el proyecto desde su perspectiva usando datos reales de las tareas</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {project.dimensions?.map((dim) => {
            const info = DIMENSION_INFO[dim];
            if (!info) return null;
            const Icon = info.icon;
            const isAnalyzing = analyzingDim === dim;
            const result = dimResults[dim];
            const error = dimErrors[dim];
            return (
              <div key={dim} className={`${info.cardBg} border rounded-xl overflow-hidden hover:shadow-lg transition-all`}>
                <div className="p-4 text-center">
                  <Icon className={`h-10 w-10 ${info.color} mx-auto mb-2`} />
                  <div className={`font-bold text-lg ${info.color}`}>{info.label}</div>
                  <div className="text-xs text-gray-500 mt-1 mb-3">{info.desc}</div>
                  <button onClick={() => analyzeDimension(dim)} disabled={isAnalyzing} className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg text-xs font-medium transition-all bg-gradient-to-r ${info.gradient} hover:opacity-90 disabled:opacity-50`}>
                    {isAnalyzing ? <><Loader2 className="h-3 w-3 animate-spin" /> Analizando...</> : <><Sparkles className="h-3 w-3" /> Analizar con IA</>}
                  </button>
                  {error && <div className="mt-2 flex items-start gap-1 text-xs text-red-600 bg-red-50 p-2 rounded"><AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /><span>{error}</span></div>}
                </div>
                {result && <div className="border-t border-gray-200 p-4 bg-white"><div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">{result}</div></div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6 border-b border-gray-200 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <nav className="flex gap-4 md:gap-6 min-w-max">
          {[
            { id: 'tasks' as const, label: 'Tareas', icon: CheckCircle2 },
            { id: 'gantt' as const, label: 'Gantt', icon: BarChart3 },
            { id: 'team' as const, label: 'Equipo', icon: Users },
            { id: 'models' as const, label: 'Modelos', icon: Box },
            { id: 'analytics' as const, label: 'Analíticas', icon: FileText },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 md:gap-2 pb-3 px-1 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
                <TabIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'tasks' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Tareas del Proyecto</h3>
            <button onClick={() => setShowTaskForm(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Agregar Tarea
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
                    {project.dimensions?.map((dim) => <option key={dim} value={dim}>{dim} - {DIMENSION_INFO[dim]?.desc}</option>)}
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
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><p>No hay tareas todavía. Agrega la primera tarea del proyecto.</p></div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <button onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')} className="mt-1 flex-shrink-0">
                      {task.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-gray-300 hover:text-green-400 transition-colors" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.name}</h3>
                          {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColors[task.priority] || 'bg-gray-100 text-gray-700'}`}>
                          {task.priority === 'low' ? 'Baja' : task.priority === 'medium' ? 'Media' : task.priority === 'high' ? 'Alta' : 'Crítica'}
                        </span>
                        {task.phase && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{task.phase}</span>}
                        {task.dimension && DIMENSION_INFO[task.dimension] && (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${DIMENSION_INFO[task.dimension].color} ${DIMENSION_INFO[task.dimension].bg}`}>{task.dimension}</span>
                        )}
                        {task.start_date && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(task.start_date).toLocaleDateString()}</span>}
                        {task.estimated_hours && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />{task.estimated_hours}h</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'gantt' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagrama Gantt</h3>
          {!hasDates ? (
            <div className="text-center py-12 text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Asigna fechas de inicio a las tareas para ver el diagrama Gantt</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {(() => {
                const datedTasks = tasks.filter(t => t.start_date).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
                if (datedTasks.length === 0) return <div className="text-center py-8 text-gray-400">No hay tareas con fechas asignadas</div>;
                const minDate = new Date(Math.min(...datedTasks.map(t => new Date(t.start_date).getTime())));
                const maxDate = new Date(Math.max(...datedTasks.map(t => new Date(t.end_date || t.start_date).getTime())));
                const dayDiff = Math.max((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24), 7);
                const days = Math.ceil(dayDiff) + 1;
                const columns = Math.min(days, 60);
                return (
                  <div>
                    <div className="flex mb-2" style={{ minWidth: `${columns * 32 + 250}px` }}>
                      <div className="w-[250px] flex-shrink-0 pr-4">
                        <span className="text-xs font-medium text-gray-500">Tarea</span>
                      </div>
                      {Array.from({ length: columns }, (_, i) => {
                        const d = new Date(minDate);
                        d.setDate(d.getDate() + i);
                        return (
                          <div key={i} className="flex-1 text-center" style={{ minWidth: '32px' }}>
                            <span className="text-[10px] text-gray-400">{d.getDate()}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      {datedTasks.map((task) => {
                        const taskStart = new Date(task.start_date);
                        const taskEnd = new Date(task.end_date || task.start_date);
                        const startOffset = Math.max(0, (taskStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                        const duration = Math.max(1, (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24) + 1);
                        const barWidth = Math.max(16, (duration / columns) * (columns * 32));
                        const barLeft = (startOffset / columns) * (columns * 32);
                        const dim = task.dimension || 'sin_dimension';
                        const barColor = dimChartColors[dim] || '#6b7280';
                        return (
                          <div key={task.id} className="flex items-center" style={{ minWidth: `${columns * 32 + 250}px` }}>
                            <div className="w-[250px] flex-shrink-0 pr-4 truncate">
                              <span className="text-sm text-gray-700">{task.name}</span>
                            </div>
                            <div className="relative flex-1 h-8" style={{ minWidth: `${columns * 32}px` }}>
                              <div className="absolute h-8 flex items-center" style={{ left: `${barLeft}px` }}>
                                <div className="h-5 rounded text-white text-xs flex items-center px-2 font-medium shadow-sm" style={{ width: `${barWidth}px`, backgroundColor: barColor, minWidth: '40px' }}>
                                  <span className="truncate">{task.estimated_hours || ''}h</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Equipo del Proyecto</h3>
            <button onClick={() => setShowMemberForm(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto">
              <UserPlus className="h-4 w-4" /> Invitar
            </button>
          </div>
          {showMemberForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Invitar Miembro</h4>
                <button onClick={() => setShowMemberForm(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@ejemplo.com" />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="editor">Editor</option>
                    <option value="viewer">Lector</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={addMember} disabled={!inviteEmail} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap">Enviar</button>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><Users className="h-12 w-12 mx-auto mb-3 text-gray-300" /><p>Invita miembros al proyecto para colaborar</p></div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between hover:shadow-md transition-shadow gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm md:text-base font-semibold text-blue-700">{member.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">{member.full_name}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${member.member_role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {member.member_role === 'editor' ? 'Editor' : 'Lector'}
                    </span>
                    <button onClick={() => removeMember(member.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'models' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Modelos BIM</h3>
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer transition-colors w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              {uploading ? 'Subiendo...' : 'Subir Modelo'}
              <input type="file" className="hidden" accept=".ifc,.rvt,.rfa,.dwg,.dxf,.obj,.fbx" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          <div className="space-y-3">
            {models.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Box className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Sube modelos IFC, RVT u otros formatos BIM</p>
                <p className="text-xs mt-1">Formatos soportados: IFC, RVT, RFA, DWG, DXF, OBJ, FBX (máx 20MB)</p>
              </div>
            ) : (
              models.map((model) => (
                <div key={model.id} className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between hover:shadow-md transition-shadow gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Box className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">{model.name}</p>
                      <p className="text-xs md:text-sm text-gray-500">{formatBytes(model.file_size)} — {model.file_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 hidden sm:inline">{new Date(model.created_at).toLocaleDateString()}</span>
                    <button onClick={() => deleteModel(model.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          {!analytics ? (
            <div className="text-center py-12 text-gray-400"><p>Cargando analíticas...</p></div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <span className="text-sm font-medium text-gray-500">Total Tareas</span>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.tasks.total}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <span className="text-sm font-medium text-gray-500">Completadas</span>
                  <p className="text-3xl font-bold text-green-600 mt-1">{analytics.tasks.completed}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <span className="text-sm font-medium text-gray-500">Horas Estimadas</span>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{analytics.tasks.total_estimated_hours}h</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <span className="text-sm font-medium text-gray-500">Miembros</span>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{analytics.members?.total_members || 0}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="font-semibold text-gray-900 mb-4">Tareas por Dimensión</h4>
                  {analytics.byDimension.length === 0 ? (
                    <p className="text-sm text-gray-400">Sin datos</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.byDimension.map((d) => {
                        const maxCount = Math.max(...analytics.byDimension.map(x => x.count), 1);
                        return (
                          <div key={d.dimension}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{d.dimension === 'sin_dimension' ? 'Sin dimensión' : d.dimension}</span>
                              <span className="text-gray-500">{d.count} tareas · {d.total_hours}h</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div className="h-2.5 rounded-full" style={{ width: `${(d.count / maxCount) * 100}%`, backgroundColor: dimChartColors[d.dimension] || '#9ca3af' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="font-semibold text-gray-900 mb-4">Tareas por Prioridad</h4>
                  {analytics.byPriority.length === 0 ? (
                    <p className="text-sm text-gray-400">Sin datos</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.byPriority.map((p) => {
                        const maxCount = Math.max(...analytics.byPriority.map(x => x.count), 1);
                        const colors: Record<string, string> = { low: '#6b7280', medium: '#eab308', high: '#f97316', critical: '#ef4444' };
                        return (
                          <div key={p.priority}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 capitalize">{p.priority}</span>
                              <span className="text-gray-500">{p.count}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div className="h-2.5 rounded-full" style={{ width: `${(p.count / maxCount) * 100}%`, backgroundColor: colors[p.priority] || '#9ca3af' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-4">Tareas por Fase</h4>
                {analytics.byPhase.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin datos</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.byPhase.map((p) => {
                      const maxCount = Math.max(...analytics.byPhase.map(x => x.count), 1);
                      return (
                        <div key={p.phase}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{p.phase === 'sin_fase' ? 'Sin fase' : p.phase}</span>
                            <span className="text-gray-500">{p.count} tareas · {p.total_hours}h</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: `${(p.count / maxCount) * 100}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <button onClick={() => navigate('/ai')} className="w-full sm:inline-flex sm:w-auto items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
          <MessageSquare className="h-5 w-5 hidden sm:inline-block" />
          Consultar al Asistente IA
        </button>
      </div>
    </div>
  );
}
