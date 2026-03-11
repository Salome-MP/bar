'use client'

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, AlertTriangle, Camera, List,
  QrCode, Users, RefreshCw, ScanLine, ChevronDown, CalendarDays,
  ShoppingBag, Package,
} from 'lucide-react';

interface OccurrenceOption {
  id: string;
  date: string;
  registered_count: number;
  attended_count: number;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  delivered: boolean;
  delivered_at: string | null;
}

interface AttendeeItem {
  id: string;
  form_data: Record<string, string> | null;
  checked_in: boolean;
  checked_in_at: string | null;
  payment_status: string;
  order_items: OrderItem[];
  order_total: number;
}

export default function QrScannerPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<{ id: string; title: string; event_type: string; occurrences?: { id: string; date: string }[] }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [occurrences, setOccurrences] = useState<OccurrenceOption[]>([]);
  const [selectedOccurrence, setSelectedOccurrence] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; message: string; attendee_info?: { name: string; email: string }; order_items?: OrderItem[] } | null>(null);
  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [tab, setTab] = useState<'scan' | 'list'>('scan');
  const [searchAttendee, setSearchAttendee] = useState('');
  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);

  const barId = user?.bar_id;

  useEffect(() => {
    if (!barId) return;
    apiFetch(`/api/bars/${barId}/events`).then(async (res) => {
      const data = await res.json();
      setEvents(data);
    });
  }, [barId]);

  // Load occurrences when event is selected
  useEffect(() => {
    if (!selectedEvent) {
      setOccurrences([]);
      setSelectedOccurrence('');
      return;
    }
    apiFetch(`/api/events/${selectedEvent}/occurrences`).then(async (res) => {
      const data: OccurrenceOption[] = await res.json();
      setOccurrences(data);

      // Auto-select today's occurrence or nearest future one
      const today = new Date().toDateString();
      const todayOcc = data.find((o) => new Date(o.date).toDateString() === today);
      if (todayOcc) {
        setSelectedOccurrence(todayOcc.id);
      } else {
        const now = new Date();
        const future = data.find((o) => new Date(o.date) >= now);
        setSelectedOccurrence(future?.id || (data.length === 1 ? data[0].id : ''));
      }
    });
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedEvent && tab === 'list') {
      loadAttendees();
    }
  }, [selectedEvent, selectedOccurrence, tab]);

  const loadAttendees = async () => {
    if (!selectedEvent) return;
    let url = `/api/events/${selectedEvent}/attendees`;
    if (selectedOccurrence) {
      url += `?occurrence_id=${selectedOccurrence}`;
    }
    const res = await apiFetch(url);
    const data = await res.json();
    setAttendees(data);
  };

  const startScanner = async () => {
    if (!selectedEvent) {
      toast.error('Selecciona un evento primero');
      return;
    }
    if (occurrences.length > 1 && !selectedOccurrence) {
      toast.error('Selecciona una fecha primero');
      return;
    }
    setResult(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text: string) => {
          await scanner.stop();
          setScanning(false);
          await validateQr(text);
        },
        () => {}
      );
    } catch {
      setScanning(false);
      toast.error('No se pudo acceder a la camara');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
    }
    setScanning(false);
  };

  const validateQr = async (qrToken: string) => {
    try {
      const res = await apiFetch(`/api/events/${selectedEvent}/validate-qr`, {
        method: 'POST',
        body: JSON.stringify({
          qr_token: qrToken,
          occurrence_id: selectedOccurrence || null,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.valid) {
        // Refresh attendee list
        loadAttendees();
      }
    } catch {
      setResult({ valid: false, message: 'Error al validar el QR' });
    }
  };

  const toggleDeliver = async (itemId: string) => {
    try {
      const res = await apiFetch(`/api/order-items/${itemId}/deliver`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Update in scan result
      if (result?.order_items) {
        setResult({
          ...result,
          order_items: result.order_items.map(oi =>
            oi.id === itemId ? { ...oi, delivered: data.delivered, delivered_at: data.delivered_at } : oi
          ),
        });
      }

      // Update in attendees list
      setAttendees(prev => prev.map(a => ({
        ...a,
        order_items: a.order_items.map(oi =>
          oi.id === itemId ? { ...oi, delivered: data.delivered, delivered_at: data.delivered_at } : oi
        ),
      })));

      toast.success(data.delivered ? 'Marcado como entregado' : 'Marcado como pendiente');
    } catch {
      toast.error('Error al actualizar el pedido');
    }
  };

  const selectedEventData = events.find(e => e.id === selectedEvent);
  const selectedOccData = occurrences.find(o => o.id === selectedOccurrence);
  const checkedInCount = attendees.filter(a => a.checked_in).length;

  const filteredAttendees = searchAttendee
    ? attendees.filter(a => {
        const name = a.form_data?._attendee_name || a.form_data?.['Nombre completo'] || '';
        const email = a.form_data?._attendee_email || a.form_data?.['Email'] || '';
        const q = searchAttendee.toLowerCase();
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      })
    : attendees;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0f172a]">Control de Acceso</h2>
      </div>

      {/* Event selector */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Evento</label>
          <div className="relative max-w-md">
            <select
              value={selectedEvent}
              onChange={(e) => { setSelectedEvent(e.target.value); setResult(null); setAttendees([]); }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition appearance-none pr-10"
            >
              <option value="">Seleccionar evento</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Occurrence selector - only show if event has multiple occurrences */}
        {occurrences.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" /> Fecha
            </label>
            <div className="flex flex-wrap gap-2">
              {occurrences.map((occ) => {
                const d = new Date(occ.date);
                const isSelected = occ.id === selectedOccurrence;
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => { setSelectedOccurrence(occ.id); setResult(null); setAttendees([]); }}
                    className={`px-3 py-2 rounded-xl border text-sm transition ${
                      isSelected
                        ? 'border-[#0f172a] bg-[#0f172a] text-white'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium capitalize">
                      {d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    {isToday && <span className={`ml-1 text-xs ${isSelected ? 'text-slate-300' : 'text-blue-500'}`}>(hoy)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedEvent && (selectedOccurrence || occurrences.length <= 1) && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Registrados</p>
                  <p className="text-lg font-bold text-[#0f172a]">{attendees.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ingresaron</p>
                  <p className="text-lg font-bold text-[#0f172a]">{checkedInCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pendientes</p>
                  <p className="text-lg font-bold text-[#0f172a]">{attendees.length - checkedInCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => { setTab('scan'); stopScanner(); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
                tab === 'scan' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ScanLine className="w-4 h-4" /> Escanear
            </button>
            <button
              onClick={() => { setTab('list'); stopScanner(); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
                tab === 'list' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" /> Asistentes
            </button>
          </div>

          {/* Scan tab */}
          {tab === 'scan' && (
            <div className="max-w-md space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {!scanning && !result && (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Escanear codigo QR</p>
                    <p className="text-xs text-gray-400 mb-5">
                      {selectedOccData
                        ? `Fecha: ${new Date(selectedOccData.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                        : 'Usa la camara para validar la entrada de los asistentes'}
                    </p>
                    <button
                      onClick={startScanner}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition"
                    >
                      <Camera className="w-4 h-4" /> Abrir camara
                    </button>
                  </div>
                )}

                <div id="qr-reader" className="rounded-2xl overflow-hidden" />

                {scanning && (
                  <div className="p-4">
                    <button
                      onClick={stopScanner}
                      className="w-full px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                    >
                      Detener camara
                    </button>
                  </div>
                )}
              </div>

              {result && (
                <div className={`p-5 rounded-2xl border-2 ${
                  result.valid
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {result.valid ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-500" />
                      </div>
                    )}
                    <div>
                      <p className={`font-bold text-sm ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
                        {result.valid ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
                      </p>
                      <p className={`text-sm ${result.valid ? 'text-green-600' : 'text-red-600'}`}>
                        {result.message}
                      </p>
                      {result.valid && result.attendee_info?.name && (
                        <p className="text-sm text-green-700 font-medium mt-1">{result.attendee_info.name}</p>
                      )}
                    </div>
                  </div>
                  {/* Order items from QR scan */}
                  {result.valid && result.order_items && result.order_items.length > 0 && (
                    <div className="mt-3 bg-white rounded-xl p-3 border border-green-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" /> Pedido anticipado
                      </p>
                      <div className="space-y-1.5">
                        {result.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <span className={`text-sm ${item.delivered ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {item.quantity}x {item.name}
                            </span>
                            <button
                              onClick={() => toggleDeliver(item.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                                item.delivered
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
                              }`}
                            >
                              {item.delivered ? 'Entregado' : 'Entregar'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={startScanner}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-[#0f172a] hover:bg-gray-50 transition"
                  >
                    <ScanLine className="w-4 h-4" /> Escanear otro
                  </button>
                </div>
              )}
            </div>
          )}

          {/* List tab */}
          {tab === 'list' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <input
                  type="text"
                  value={searchAttendee}
                  onChange={(e) => setSearchAttendee(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full sm:max-w-xs border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition"
                />
                <button
                  onClick={loadAttendees}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#0f172a] transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Actualizar
                </button>
              </div>

              {filteredAttendees.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    {attendees.length === 0 ? 'No hay registros para esta fecha' : 'Sin resultados'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Asistente</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Email</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Check-in</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredAttendees.map((a) => {
                        const name = a.form_data?._attendee_name || a.form_data?.['Nombre completo'] || a.form_data?.['Nombre'] || '-';
                        const email = a.form_data?._attendee_email || a.form_data?.['Email'] || a.form_data?.['Correo'] || '-';
                        const hasOrder = a.order_items && a.order_items.length > 0;
                        const isExpanded = expandedAttendee === a.id;
                        return (
                          <tr
                            key={a.id}
                            className={`hover:bg-gray-50/50 transition ${hasOrder ? 'cursor-pointer' : ''}`}
                            onClick={() => hasOrder && setExpandedAttendee(isExpanded ? null : a.id)}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{name}</span>
                                {hasOrder && (() => {
                                  const allDelivered = a.order_items.every(oi => oi.delivered);
                                  const someDelivered = a.order_items.some(oi => oi.delivered);
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${
                                      allDelivered
                                        ? 'text-green-600 bg-green-50'
                                        : someDelivered
                                        ? 'text-amber-600 bg-amber-50'
                                        : 'text-blue-600 bg-blue-50'
                                    }`}>
                                      <ShoppingBag className="w-3 h-3" />
                                      {allDelivered ? 'Entregado' : someDelivered ? 'Parcial' : 'Pedido'}
                                    </span>
                                  );
                                })()}
                              </div>
                              {/* Expanded order details */}
                              {isExpanded && hasOrder && (
                                <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs" onClick={(e) => e.stopPropagation()}>
                                  <p className="font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pedido anticipado</p>
                                  {a.order_items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between py-1 text-gray-600">
                                      <span className={item.delivered ? 'line-through text-gray-400' : ''}>
                                        {item.quantity}x {item.name}
                                        <span className="ml-1 font-medium">${(item.unit_price * item.quantity).toFixed(2)}</span>
                                      </span>
                                      <button
                                        onClick={() => toggleDeliver(item.id)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                                          item.delivered
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
                                        }`}
                                      >
                                        {item.delivered ? 'Entregado' : 'Entregar'}
                                      </button>
                                    </div>
                                  ))}
                                  <div className="flex justify-between pt-1.5 mt-1.5 border-t border-gray-200 font-bold text-gray-900">
                                    <span>Total pedido</span>
                                    <span>${a.order_total.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-gray-500">{email}</td>
                            <td className="px-5 py-3.5">
                              {a.checked_in ? (
                                <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-lg text-xs font-medium">
                                  <CheckCircle2 className="w-3 h-3" /> Ingreso
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-medium">
                                  <AlertTriangle className="w-3 h-3" /> Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-gray-400 text-xs">
                              {a.checked_in_at
                                ? new Date(a.checked_in_at).toLocaleString('es-AR')
                                : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
