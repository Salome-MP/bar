'use client'

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  QrCode,
  BarChart3,
  UtensilsCrossed,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Inicio', path: '/dashboard' },
  { icon: CalendarDays, label: 'Eventos', path: '/dashboard/events' },
  { icon: ClipboardList, label: 'Formularios', path: '/dashboard/forms' },
  { icon: QrCode, label: 'Control de Acceso', path: '/dashboard/access' },
  { icon: UtensilsCrossed, label: 'Carta / Menu', path: '/dashboard/menu' },
  { icon: BarChart3, label: 'Analiticas', path: '/dashboard/analytics' },
  { icon: CreditCard, label: 'Pagos', path: '/dashboard/payments' },
  { icon: Settings, label: 'Mi Bar', path: '/dashboard/bar-profile' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, initialized, hydrate } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (initialized && !user) {
      router.push('/login');
    }
  }, [initialized, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  if (!initialized || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 h-screen bg-[#0f172a] border-r border-white/10 flex flex-col transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-6 py-5">
          <span className="text-xl font-bold text-white tracking-tight">AppBar</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pt-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive(item.path)
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-white/20 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar sesion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-[#0f172a]">
              Hola, {user?.first_name}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
