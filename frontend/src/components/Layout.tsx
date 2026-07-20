import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, MessageSquare, LogOut, Building2, Menu, X } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Proyectos', icon: LayoutDashboard },
    { path: '/ai', label: 'Asistente IA', icon: MessageSquare },
  ];

  const isActive = (path: string) => path === '/' ? (location.pathname === '/' || location.pathname.startsWith('/projects')) : location.pathname.startsWith(path);

  const NavContent = ({ mobile }: { mobile?: boolean }) => (
    <>
      <nav className={`${mobile ? '' : 'hidden md:block'} flex-1 p-4 space-y-1`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.path) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className={`${mobile ? '' : 'hidden md:block'} p-4 border-t border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="text-sm min-w-0">
            <p className="font-medium text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-gray-500 truncate">{user?.email}</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="p-2 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0" title="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg text-gray-900">BIM AI</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600 hover:text-gray-900">
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-lg text-gray-900">BIM AI</span>
              </div>
            </div>
            <NavContent mobile />
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-lg text-gray-900">BIM AI</span>
          </div>
        </div>
        <NavContent />
      </aside>

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}`}>
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
