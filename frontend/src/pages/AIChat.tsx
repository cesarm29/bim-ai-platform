import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Sparkles, Trash2, Plus, Loader2 } from 'lucide-react';
import api from '../services/api';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  updated_at: string;
}

export default function AIChat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/ai/conversations').then((res) => setConversations(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (conversationId) {
      api.get(`/ai/conversations/${conversationId}`).then((res) => setMessages(res.data)).catch(() => {});
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input;
    setInput('');
    setSending(true);

    if (!conversationId) {
      setMessages([...messages, { id: 'temp', role: 'user', content: userMsg, created_at: new Date().toISOString() }]);
    } else {
      setMessages([...messages, { id: 'temp', role: 'user', content: userMsg, created_at: new Date().toISOString() }]);
    }

    try {
      const res = await api.post('/ai/chat', {
        message: userMsg,
        conversationId: conversationId || undefined,
      });

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'temp'),
        { id: 'user-' + Date.now(), role: 'user', content: userMsg, created_at: new Date().toISOString() },
        { id: 'ai-' + Date.now(), role: 'assistant', content: res.data.response, created_at: new Date().toISOString() },
      ]);

      if (!conversationId) {
        navigate(`/ai/${res.data.conversationId}`);
      }

      api.get('/ai/conversations').then((r) => setConversations(r.data)).catch(() => {});
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'temp'),
        { id: 'user-' + Date.now(), role: 'user', content: userMsg, created_at: new Date().toISOString() },
        { id: 'ai-' + Date.now(), role: 'assistant', content: 'Error al conectar con la IA. Verifica la configuración de Gemini API.', created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await api.delete(`/ai/conversations/${id}`);
      setConversations(conversations.filter((c) => c.id !== id));
      if (conversationId === id) navigate('/ai');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="w-72 bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
        <button
          onClick={() => navigate('/ai')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mb-4"
        >
          <Plus className="h-4 w-4" />
          Nueva Conversación
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                conv.id === conversationId ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
              }`}
              onClick={() => navigate(`/ai/${conv.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                <p className="text-xs text-gray-400">{conv.message_count} mensajes</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Asistente BIM con IA
          </h2>
          <p className="text-sm text-gray-400">Consulta sobre planificación, costos, materiales y más</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="h-12 w-12 text-blue-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">¿En qué puedo ayudarte?</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Pregunta sobre planificación de obras, estimación de costos, optimización de tiempos,
                materiales, normativas BIM, detección de conflictos y más.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mt-6">
                {[
                  '¿Cómo optimizar el cronograma de obra?',
                  'Estimar costos para edificio de 5 pisos',
                  'Mejores prácticas para coordinación BIM',
                  '¿Cómo reducir tiempos en construcción?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                    }}
                    className="p-3 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors text-left border border-gray-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'assistant'
                      ? 'bg-gray-50 border border-gray-200 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta sobre BIM..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
