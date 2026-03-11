'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays, Users, DollarSign, ClipboardList,
  CheckCircle2, Loader2, Download, ArrowLeft,
  ShoppingBag, Plus, Minus, ChevronRight, ChevronLeft,
  ChevronDown, Repeat,
} from 'lucide-react';

interface OccurrenceItem {
  id: string;
  date: string;
  registered_count: number;
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  start_date: string;
  end_date: string | null;
  event_type: string;
  recurrence_rule: { frequency: string; days_of_week: string[]; end_date?: string } | null;
  access_type: string;
  has_access_control: boolean;
  form_id: string | null;
  price: number | null;
  capacity: number | null;
  bar_id: string;
  bar_name: string | null;
  registered_count: number;
  occurrences?: OccurrenceItem[];
}

interface FormField {
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
}

interface MenuCategoryData {
  id: string;
  name: string;
  items: MenuItemData[];
}

interface OrderItemEntry {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
}

interface RegistrationResult {
  id: string;
  qr_token: string;
  order_items: { menu_item_name: string; quantity: number; unit_price: number }[];
  order_total: number;
  entry_price: number;
  total: number;
}

export default function EventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<RegistrationResult | null>(null);
  const [error, setError] = useState('');
  const [selectedOccurrence, setSelectedOccurrence] = useState<string>('');

  // Menu & order state
  const [menuCategories, setMenuCategories] = useState<MenuCategoryData[]>([]);
  const [orderItems, setOrderItems] = useState<Map<string, OrderItemEntry>>(new Map());
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(1); // 1=datos, 2=carta, 3=resumen

  const needsForm = event?.access_type === 'FREE_WITH_FORM' || event?.access_type === 'PAID';
  const hasMenu = menuCategories.some(c => c.items.length > 0);
  const totalSteps = hasMenu ? 3 : 1;

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/events/${eventId}`).then(async (res) => {
      const data = await res.json();
      setEvent(data);

      // Auto-select nearest future occurrence
      if (data.occurrences && data.occurrences.length > 0) {
        const now = new Date();
        const future = data.occurrences.find((o: OccurrenceItem) => new Date(o.date) >= now);
        setSelectedOccurrence(future?.id || data.occurrences[0].id);
      }

      // Load form fields
      if (data.form_id) {
        const formRes = await fetch(`/api/forms/${data.form_id}`);
        const formDataRes = await formRes.json();
        setFormFields(formDataRes.fields);
      }

      // Load menu
      if (data.bar_id && (data.access_type === 'FREE_WITH_FORM' || data.access_type === 'PAID')) {
        const menuRes = await fetch(`/api/bars/${data.bar_id}/menu`);
        const menuData = await menuRes.json();
        setMenuCategories(menuData);
      }
    });
  }, [eventId]);

  const updateItemQuantity = (item: MenuItemData, delta: number) => {
    setOrderItems(prev => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      const newQty = (existing?.quantity || 0) + delta;
      if (newQty <= 0) {
        next.delete(item.id);
      } else {
        next.set(item.id, {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: newQty,
          notes: existing?.notes || '',
        });
      }
      return next;
    });
  };

  const orderItemsArray = Array.from(orderItems.values());
  const orderTotal = orderItemsArray.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const entryPrice = event?.price || 0;
  const grandTotal = entryPrice + orderTotal;

  const validateStep1 = () => {
    if (needsForm && formFields.length > 0) {
      // Validar campos del formulario enlazado
      for (const field of formFields) {
        if (field.required && !formData[field.label]?.trim()) return false;
      }
    } else {
      // Validar campos por defecto
      if (!attendeeName.trim() || !attendeeEmail.trim()) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    setError('');
    if (step === 1 && !hasMenu) {
      handleRegister();
    } else {
      setStep(s => s + 1);
    }
  };

  // Extraer nombre y email: del formulario enlazado o de los campos fijos
  const resolvedName = needsForm && formFields.length > 0
    ? (formData['Nombre completo'] || formData['Nombre'] || Object.values(formData)[0] || '')
    : attendeeName;
  const resolvedEmail = needsForm && formFields.length > 0
    ? (formData['Email'] || formData['Correo'] || '')
    : attendeeEmail;
  const resolvedPhone = needsForm && formFields.length > 0
    ? (formData['Telefono'] || formData['Celular'] || formData['Phone'] || '')
    : attendeePhone;

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_data: Object.keys(formData).length > 0 ? formData : null,
          attendee_name: resolvedName || null,
          attendee_email: resolvedEmail || null,
          attendee_phone: resolvedPhone || null,
          occurrence_id: selectedOccurrence || null,
          order_items: orderItemsArray.length > 0
            ? orderItemsArray.map(i => ({
                menu_item_id: i.menu_item_id,
                quantity: i.quantity,
                notes: i.notes || null,
              }))
            : null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Error al registrarse');
      }
      const data = await res.json();
      setRegistration(data);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Confirmacion con QR
  if (registration) {
    const qrUrl = `/api/registrations/${registration.id}/qr`;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Registro exitoso</h1>
          <p className="text-gray-500 mb-6">
            Te registraste a <strong className="text-[#0f172a]">{event.title}</strong>
          </p>

          {/* Order summary */}
          {registration.order_items && registration.order_items.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-[#0f172a] mb-2">Tu pedido</p>
              {registration.order_items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-600 py-1">
                  <span>{item.quantity}x {item.menu_item_name}</span>
                  <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {entryPrice > 0 && (
                <div className="flex justify-between text-sm text-gray-600 py-1 border-t border-gray-200 mt-2 pt-2">
                  <span>Entrada</span>
                  <span>${entryPrice.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#0f172a] border-t border-gray-200 mt-2 pt-2">
                <span>Total</span>
                <span>${registration.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {event.has_access_control && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Presenta este codigo QR en la entrada:
              </p>
              <img
                src={qrUrl}
                alt="QR de acceso"
                className="w-48 h-48 mx-auto mb-6 rounded-2xl border border-gray-200"
              />
              <a
                href={qrUrl}
                download={`qr-${registration.id}.png`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition"
              >
                <Download className="w-4 h-4" /> Descargar QR
              </a>
            </>
          )}

          {!event.has_access_control && (
            <p className="text-sm text-gray-500">
              Este evento no requiere codigo QR. Solo acercate el dia del evento.
            </p>
          )}
        </div>
      </div>
    );
  }

  const selectedOcc = event.occurrences?.find((o) => o.id === selectedOccurrence);
  const occRegisteredCount = selectedOcc?.registered_count ?? event.registered_count;
  const isFull = event.capacity && occRegisteredCount >= event.capacity;

  const startDate = new Date(event.start_date);
  const fullDate = startDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = startDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#0f172a] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            AppBar
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 transition font-medium">
              Iniciar Sesion
            </Link>
            <Link href="/register" className="text-sm px-4 py-2 bg-white text-[#0f172a] rounded-xl hover:bg-slate-100 transition font-medium">
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1">
        {/* Event image */}
        {event.image && (
          <div className="w-full h-56 sm:h-72 bg-gray-200">
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link href={`/bar/${event.bar_id}`} className="inline-flex items-center gap-1.5 text-gray-400 hover:text-[#0f172a] text-sm transition">
              <ArrowLeft className="w-3.5 h-3.5" /> {event.bar_name || 'Volver'}
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: event info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] leading-tight">{event.title}</h1>

              {event.bar_name && (
                <p className="text-sm text-gray-400 mt-1">Organizado por <Link href={`/bar/${event.bar_id}`} className="text-[#0f172a] font-medium hover:underline">{event.bar_name}</Link></p>
              )}

              {/* Event details card */}
              <div className="bg-white rounded-2xl shadow-sm p-5 mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium uppercase leading-none">
                      {startDate.toLocaleDateString('es-AR', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold leading-none">{startDate.getDate()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0f172a] capitalize">{fullDate}</p>
                    <p className="text-xs text-gray-400">{timeStr}{event.end_date ? ` - ${new Date(event.end_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                  </div>
                </div>

                {event.event_type === 'RECURRING' && event.recurrence_rule && (
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-600 font-medium">
                      {event.recurrence_rule.frequency === 'WEEKLY' ? 'Semanal' : event.recurrence_rule.frequency === 'BIWEEKLY' ? 'Quincenal' : 'Mensual'}
                      {event.recurrence_rule.days_of_week?.length > 0 && (
                        <> - {event.recurrence_rule.days_of_week.map(d => {
                          const map: Record<string, string> = { MON: 'Lun', TUE: 'Mar', WED: 'Mie', THU: 'Jue', FRI: 'Vie', SAT: 'Sab', SUN: 'Dom' };
                          return map[d] || d;
                        }).join(', ')}</>
                      )}
                    </span>
                  </div>
                )}

                {/* Date selector for recurring events */}
                {event.occurrences && event.occurrences.length > 1 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selecciona una fecha</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {event.occurrences.filter((o) => new Date(o.date) >= new Date(new Date().toDateString())).map((occ) => {
                        const d = new Date(occ.date);
                        const isSelected = occ.id === selectedOccurrence;
                        const occFull = event.capacity ? occ.registered_count >= event.capacity : false;
                        return (
                          <button
                            key={occ.id}
                            type="button"
                            onClick={() => setSelectedOccurrence(occ.id)}
                            disabled={occFull}
                            className={`text-left px-3 py-2 rounded-xl border text-sm transition ${
                              isSelected
                                ? 'border-[#0f172a] bg-[#0f172a] text-white'
                                : occFull
                                ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            <p className="font-medium capitalize">
                              {d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            <p className={`text-xs ${isSelected ? 'text-slate-300' : 'text-gray-400'}`}>
                              {occFull ? 'Agotado' : event.capacity ? `${occ.registered_count}/${event.capacity}` : `${occ.registered_count} registrados`}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="bg-white rounded-2xl shadow-sm p-5 mt-4">
                  <h2 className="text-sm font-semibold text-[#0f172a] mb-2">Acerca del evento</h2>
                  <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{event.description}</p>
                </div>
              )}
            </div>

            {/* Right: sidebar with price, capacity, registration */}
            <div className="lg:w-[360px] flex-shrink-0 space-y-4">
              {/* Price & capacity card */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                {/* Price */}
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Inscripcion</p>
                  {event.price && event.price > 0 ? (
                    <p className="text-3xl font-bold text-[#0f172a] mt-1">${event.price}</p>
                  ) : (
                    <p className="text-2xl font-bold text-green-600 mt-1">Gratis</p>
                  )}
                </div>

                {/* Capacity */}
                {event.capacity && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                      <span>Capacidad ({event.capacity} cupos)</span>
                      <span className="font-medium text-[#0f172a]">{occRegisteredCount} / {event.capacity - occRegisteredCount} disponibles</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-[#0f172a]'}`}
                        style={{ width: `${Math.min(100, (occRegisteredCount / event.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {isFull && (
                  <div className="bg-red-50 border border-red-200 rounded-xl py-3 text-center">
                    <p className="text-red-600 font-semibold text-sm">Agotado</p>
                  </div>
                )}
              </div>

        {/* Registration */}
        {isFull ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-gray-400 text-sm">Las inscripciones estan cerradas para este evento.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            {/* Step indicator */}
            {totalSteps > 1 && (
              <div className="flex items-center gap-2 mb-6">
                {[1, 2, 3].slice(0, totalSteps).map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      step === s
                        ? 'bg-[#0f172a] text-white'
                        : step > s
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                    {s < totalSteps && (
                      <div className={`w-8 h-0.5 ${step > s ? 'bg-green-200' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
                <span className="ml-2 text-xs text-gray-400">
                  {step === 1 ? 'Tus datos' : step === 2 ? 'Carta' : 'Resumen'}
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            {/* STEP 1: Personal data */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] mb-6 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-gray-400" /> Registrarse
                </h2>

                <div className="space-y-5">
                  {/* Si hay formulario enlazado, solo mostrar los campos del formulario */}
                  {needsForm && formFields.length > 0 ? (
                    formFields.map((field, i) => (
                      <div key={i}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={formData[field.label] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                            required={field.required}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent transition"
                          >
                            <option value="">Seleccionar</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'checkbox' ? (
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={formData[field.label] === 'true'}
                              onChange={(e) => setFormData({ ...formData, [field.label]: String(e.target.checked) })}
                              className="rounded"
                            />
                            {field.label}
                          </label>
                        ) : (
                          <input
                            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
                            value={formData[field.label] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                            required={field.required}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent transition"
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    /* Sin formulario enlazado (FREE): campos por defecto */
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Nombre completo <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={attendeeName}
                          onChange={(e) => setAttendeeName(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={attendeeEmail}
                          onChange={(e) => setAttendeeEmail(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Telefono
                        </label>
                        <input
                          type="tel"
                          value={attendeePhone}
                          onChange={(e) => setAttendeePhone(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent transition"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-[#0f172a] text-white py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#1e293b] transition"
                  >
                    {hasMenu ? (
                      <>Siguiente <ChevronRight className="w-4 h-4" /></>
                    ) : loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                    ) : (
                      'Registrarme'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Menu selection */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] mb-1 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gray-400" /> Pedido anticipado
                </h2>
                <p className="text-sm text-gray-400 mb-5">
                  Opcional: toca una categoria para ver los productos
                </p>

                <div className="space-y-2">
                  {menuCategories.filter(c => c.items.length > 0).map((cat) => {
                    const isOpen = openCategories.has(cat.id);
                    const catItemCount = cat.items.reduce((sum, item) => sum + (orderItems.get(item.id)?.quantity || 0), 0);
                    return (
                      <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCategories(prev => {
                              const next = new Set(prev);
                              if (next.has(cat.id)) next.delete(cat.id);
                              else next.add(cat.id);
                              return next;
                            });
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 bg-[#fafafa] hover:bg-gray-100 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#0f172a]">{cat.name}</span>
                            <span className="text-xs text-gray-400">{cat.items.length} items</span>
                            {catItemCount > 0 && (
                              <span className="bg-[#0f172a] text-white text-xs font-bold px-2 py-0.5 rounded-full">{catItemCount}</span>
                            )}
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="divide-y divide-gray-100">
                            {cat.items.map((item) => {
                              const qty = orderItems.get(item.id)?.quantity || 0;
                              return (
                                <div
                                  key={item.id}
                                  className={`flex items-center justify-between px-4 py-2.5 transition ${
                                    qty > 0 ? 'bg-blue-50/50' : 'bg-white'
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium text-[#0f172a]">{item.name}</p>
                                      <p className="text-sm font-semibold text-blue-600">${item.price.toLocaleString('es-AR')}</p>
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-gray-400 truncate">{item.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 ml-3">
                                    {qty > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => updateItemQuantity(item, -1)}
                                        className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                                      >
                                        <Minus className="w-3 h-3 text-gray-600" />
                                      </button>
                                    )}
                                    {qty > 0 && (
                                      <span className="w-5 text-center text-sm font-bold text-[#0f172a]">{qty}</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => updateItemQuantity(item, 1)}
                                      className="w-7 h-7 rounded-lg bg-[#0f172a] flex items-center justify-center hover:bg-[#1e293b] transition"
                                    >
                                      <Plus className="w-3 h-3 text-white" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Order subtotal */}
                {orderTotal > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-3 flex justify-between items-center text-sm">
                    <span className="text-gray-500">{orderItemsArray.reduce((s, i) => s + i.quantity, 0)} items</span>
                    <span className="font-bold text-[#0f172a]">Subtotal: ${orderTotal.toLocaleString('es-AR')}</span>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Atras
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 bg-[#0f172a] text-white py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#1e293b] transition"
                  >
                    {orderItemsArray.length > 0 ? 'Ver resumen' : 'Saltar'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Summary */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] mb-6 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-gray-400" /> Resumen
                </h2>

                <div className="space-y-4">
                  {/* Personal info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Datos</p>
                    {needsForm && formFields.length > 0 ? (
                      Object.entries(formData).filter(([, v]) => v).map(([key, val]) => (
                        <p key={key} className="text-sm text-gray-600 py-0.5">
                          <span className="font-medium text-[#0f172a]">{key}:</span> {val}
                        </p>
                      ))
                    ) : (
                      <>
                        <p className="text-sm text-[#0f172a] font-medium">{attendeeName}</p>
                        <p className="text-sm text-gray-500">{attendeeEmail}</p>
                        {attendeePhone && <p className="text-sm text-gray-500">{attendeePhone}</p>}
                      </>
                    )}
                  </div>

                  {/* Order */}
                  {orderItemsArray.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pedido</p>
                      {orderItemsArray.map((item) => (
                        <div key={item.menu_item_id} className="flex justify-between text-sm py-1">
                          <span className="text-gray-600">{item.quantity}x {item.name}</span>
                          <span className="text-[#0f172a] font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-[#0f172a] text-white rounded-xl p-4">
                    {entryPrice > 0 && (
                      <div className="flex justify-between text-sm text-slate-300 mb-1">
                        <span>Entrada</span>
                        <span>${entryPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {orderTotal > 0 && (
                      <div className="flex justify-between text-sm text-slate-300 mb-1">
                        <span>Pedido</span>
                        <span>${orderTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold mt-1">
                      <span>Total</span>
                      <span>${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Atras
                  </button>
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={loading}
                    className="flex-1 bg-[#0f172a] text-white py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#1e293b] transition disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
                    ) : (
                      'Confirmar registro'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

            </div>{/* end sidebar */}
          </div>{/* end two-column */}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-slate-400 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <span className="font-semibold text-white text-sm">AppBar</span>
          <p className="text-xs">2026 AppBar. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
