'use client'

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Store,
  CalendarDays,
  Users,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
} from 'lucide-react';

interface PlatformStats {
  total_bars: number;
  active_bars: number;
  total_events: number;
  total_registrations: number;
  total_revenue: number;
}

interface AdminBar {
  id: string;
  name: string;
  is_active: boolean;
  owner_email: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [bars, setBars] = useState<AdminBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, barsRes] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/bars'),
      ]);
      setStats(await statsRes.json());
      setBars(await barsRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (bar: AdminBar) => {
    setTogglingId(bar.id);
    try {
      const res = await apiFetch(`/api/admin/bars/${bar.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !bar.is_active }),
      });
      if (!res.ok) throw new Error();
      setBars((prev) =>
        prev.map((b) => (b.id === bar.id ? { ...b, is_active: !b.is_active } : b))
      );
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: 'Bares totales', value: stats.total_bars },
        { label: 'Bares activos', value: stats.active_bars },
        { label: 'Eventos totales', value: stats.total_events },
        { label: 'Registros totales', value: stats.total_registrations },
        {
          label: 'Ingresos totales',
          value: `$${stats.total_revenue.toLocaleString()}`,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navy header */}
      <div className="bg-[#0f172a] text-white py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Panel de Administracion
          </h1>
          <p className="text-slate-300 text-sm mt-1">Gestion de la plataforma</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Bars list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Bares registrados</h2>
          {bars.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center text-gray-400">
              No hay bares registrados.
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Nombre</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Propietario</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Fecha de registro</th>
                      <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                      <th className="text-center px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bars.map((bar) => (
                      <tr key={bar.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4 font-medium text-gray-900">{bar.name}</td>
                        <td className="px-5 py-4 text-gray-500">{bar.owner_email}</td>
                        <td className="px-5 py-4 text-gray-400">
                          {new Date(bar.created_at).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                              bar.is_active
                                ? 'bg-gray-100 text-green-700'
                                : 'bg-gray-100 text-red-600'
                            }`}
                          >
                            {bar.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(bar)}
                            disabled={togglingId === bar.id}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition disabled:opacity-50 ${
                              bar.is_active
                                ? 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                : 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
                            }`}
                          >
                            {bar.is_active ? (
                              <>
                                <ToggleRight className="w-4 h-4" /> Desactivar
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4" /> Activar
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
