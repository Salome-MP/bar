'use client'

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  BarChart3,
  CalendarDays,
  Users,
  UserCheck,
  DollarSign,
  Download,
  ChevronDown,
  TrendingUp,
  Percent,
} from 'lucide-react';

interface BarAnalytics {
  total_events: number;
  active_events: number;
  total_registrations: number;
  total_attendances: number;
  total_revenue: number;
}

interface EventOption {
  id: string;
  title: string;
  event_type: string;
}

interface OccurrenceStat {
  id: string;
  date: string;
  registered: number;
  attended: number;
  attendance_rate: number;
}

interface EventAnalytics {
  total_registered: number;
  total_attended: number;
  attendance_rate: number;
  total_revenue: number;
  capacity: number | null;
  occupancy_rate: number | null;
  occurrence_stats: OccurrenceStat[] | null;
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const barId = user?.bar_id;

  const [barStats, setBarStats] = useState<BarAnalytics | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventStats, setEventStats] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!barId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [analyticsRes, eventsRes] = await Promise.all([
          apiFetch(`/api/bars/${barId}/analytics`),
          apiFetch(`/api/bars/${barId}/events`),
        ]);
        setBarStats(await analyticsRes.json());
        setEvents(await eventsRes.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [barId]);

  useEffect(() => {
    if (!selectedEventId) {
      setEventStats(null);
      return;
    }
    const load = async () => {
      try {
        const res = await apiFetch(`/api/events/${selectedEventId}/analytics`);
        const data = await res.json();
        setEventStats(data);
      } catch {
        setEventStats(null);
      }
    };
    load();
  }, [selectedEventId]);

  const handleExport = async () => {
    if (!selectedEventId) return;
    setExporting(true);
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`/api/events/${selectedEventId}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evento_${selectedEventId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Cargando...
      </div>
    );
  }

  const statCards = barStats
    ? [
        { label: 'Eventos totales', value: barStats.total_events },
        { label: 'Eventos activos', value: barStats.active_events },
        { label: 'Registros totales', value: barStats.total_registrations },
        { label: 'Asistencias totales', value: barStats.total_attendances },
        { label: 'Ingresos totales', value: `$${barStats.total_revenue.toLocaleString()}` },
      ]
    : [];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Analiticas</h2>

      {/* Bar-level stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Per-event analytics */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Analiticas por evento</h3>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition"
            >
              <option value="">Seleccionar evento</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedEventId && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </button>
          )}
        </div>

        {eventStats ? (
          <div className="space-y-6">
            {/* Overall stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-1">Registrados</p>
                <p className="text-2xl font-bold text-gray-900">{eventStats.total_registered}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-1">Asistieron</p>
                <p className="text-2xl font-bold text-gray-900">{eventStats.total_attended}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-1">Tasa de asistencia</p>
                <p className="text-2xl font-bold text-gray-900">
                  {eventStats.attendance_rate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-1">Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${eventStats.total_revenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-1">Ocupacion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {eventStats.capacity
                    ? `${eventStats.total_registered}/${eventStats.capacity}`
                    : 'Sin limite'}
                </p>
                {eventStats.occupancy_rate !== null && eventStats.capacity && (
                  <p className="text-xs text-gray-400 mt-0.5">{eventStats.occupancy_rate?.toFixed(1)}%</p>
                )}
              </div>
            </div>

            {/* Per-occurrence breakdown */}
            {eventStats.occurrence_stats && eventStats.occurrence_stats.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" /> Desglose por fecha
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs uppercase">Fecha</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-500 text-xs uppercase">Registrados</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-500 text-xs uppercase">Asistieron</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-500 text-xs uppercase">Tasa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {eventStats.occurrence_stats.map((occ) => {
                        const d = new Date(occ.date);
                        const isPast = d < new Date();
                        return (
                          <tr key={occ.id} className={`${isPast ? '' : 'text-gray-400'}`}>
                            <td className="px-4 py-2.5 font-medium capitalize">
                              {d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-4 py-2.5 text-right">{occ.registered}</td>
                            <td className="px-4 py-2.5 text-right">{occ.attended}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                                occ.attendance_rate >= 70
                                  ? 'bg-green-50 text-green-700'
                                  : occ.attendance_rate >= 40
                                  ? 'bg-amber-50 text-amber-700'
                                  : occ.registered === 0
                                  ? 'bg-gray-50 text-gray-400'
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                {occ.attendance_rate.toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : selectedEventId ? (
          <p className="text-gray-400 text-sm">Cargando datos del evento...</p>
        ) : (
          <p className="text-gray-400 text-sm">Selecciona un evento para ver sus analiticas.</p>
        )}
      </div>
    </div>
  );
}
