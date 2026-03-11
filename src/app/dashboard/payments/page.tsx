'use client'

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiFetch } from '@/lib/api';
import { CreditCard } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  state: string;
  event_title: string;
  attendee_name: string;
  created_at: string;
  external_ref: string | null;
}

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const barId = user?.bar_id;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/payments/bar/${barId}`);
        const data = await res.json();
        setPayments(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [barId]);

  const stateLabel: Record<string, { text: string; color: string }> = {
    approved: { text: 'Aprobado', color: 'bg-gray-100 text-green-700' },
    pending: { text: 'Pendiente', color: 'bg-gray-100 text-amber-700' },
    rejected: { text: 'Rechazado', color: 'bg-gray-100 text-red-600' },
    refunded: { text: 'Reembolsado', color: 'bg-gray-100 text-gray-500' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Pagos</h2>

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center text-gray-400">
          No hay pagos registrados.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Evento</th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Asistente</th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Monto</th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs uppercase tracking-wider">Ref. externa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => {
                  const state = stateLabel[p.state] || {
                    text: p.state,
                    color: 'bg-gray-100 text-gray-500',
                  };
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">{p.event_title}</td>
                      <td className="px-5 py-4 text-gray-500">{p.attendee_name}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        ${p.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${state.color}`}>
                          {state.text}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs font-mono">
                        {p.external_ref || '-'}
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
  );
}
