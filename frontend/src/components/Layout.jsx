import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Menu, X, LogOut, User, Settings, BarChart3, Zap } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/apis', label: 'APIs', icon: Settings },
    { path: '/keys', label: 'API Keys', icon: User },
    { path: '/billing', label: 'Billing', icon: Settings },
    { path: '/testing', label: 'Testing', icon: Zap }
  ];

  if (user?.role === 'admin') {
    menuItems.push({ path: '/admin', label: 'Admin', icon: Settings });
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary-600">MeterFlow</h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                isActive(item.path)
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">MeterFlow</h1>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {isMenuOpen && (
          <nav className="bg-gray-50 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-20">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
