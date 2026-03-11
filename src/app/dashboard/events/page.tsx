'use client'

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus, Users, ExternalLink, Trash2, Pencil, X, Eye, EyeOff, Camera, Loader2, Repeat,
  CalendarDays, ClipboardList, MonitorSmartphone,
} from 'lucide-react';

interface EventItem {
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
  is_active: boolean;
  registered_count: number;
}

interface FormOption {
  id: string;
  name: string;
}

const DAYS_OF_WEEK = [
  { value: 'MON', label: 'Lun' },
  { value: 'TUE', label: 'Mar' },
  { value: 'WED', label: 'Mie' },
  { value: 'THU', label: 'Jue' },
  { value: 'FRI', label: 'Vie' },
  { value: 'SAT', label: 'Sab' },
  { value: 'SUN', label: 'Dom' },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  image: '',
  start_date: '',
  end_date: '',
  event_type: 'SINGLE',
  recurrence_frequency: 'WEEKLY',
  recurrence_days: [] as string[],
  recurrence_end_date: '',
  access_type: 'FREE',
  has_access_control: true,
  form_id: '',
  price: '',
  capacity: '',
};

function toLocalDatetime(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [formOptions, setFormOptions] = useState<FormOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const barId = user?.bar_id;
  const isEditing = editingId !== null;
  const formRef = useRef<HTMLFormElement>(null);

  const loadData = async () => {
    if (!barId) return;
    const [evRes, formRes] = await Promise.all([
      apiFetch(`/api/bars/${barId}/events`),
      apiFetch(`/api/bars/${barId}/forms`),
    ]);
    setEvents(await evRes.json());
    setFormOptions(await formRes.json());
  };

  useEffect(() => {
    loadData();
  }, [barId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFormFields, setPreviewFormFields] = useState<{ type: string; label: string; required: boolean; options?: string[] }[]>([]);

  // Load form fields when form_id changes (for preview)
  useEffect(() => {
    if (!form.form_id) {
      setPreviewFormFields([]);
      return;
    }
    apiFetch(`/api/forms/${form.form_id}`).then(async (res) => {
      const data = await res.json();
      setPreviewFormFields(data.fields || []);
    }).catch(() => setPreviewFormFields([]));
  }, [form.form_id]);

  const startEdit = (ev: EventItem) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description || '',
      image: ev.image || '',
      start_date: toLocalDatetime(ev.start_date),
      end_date: ev.end_date ? toLocalDatetime(ev.end_date) : '',
      event_type: ev.event_type || 'SINGLE',
      recurrence_frequency: ev.recurrence_rule?.frequency || 'WEEKLY',
      recurrence_days: ev.recurrence_rule?.days_of_week || [],
      recurrence_end_date: ev.recurrence_rule?.end_date ? toLocalDatetime(ev.recurrence_rule.end_date) : '',
      access_type: ev.access_type,
      has_access_control: ev.has_access_control,
      form_id: ev.form_id || '',
      price: ev.price != null ? String(ev.price) : '',
      capacity: ev.capacity != null ? String(ev.capacity) : '',
    });
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail);
      }
      const { url } = await res.json();
      setForm({ ...form, image: url });
      toast.success('Imagen subida');
    } catch (err: any) {
      toast.error(err.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barId) return;
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        title: form.title,
        description: form.description || null,
        image: form.image || null,
        start_date: new Date(form.start_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        event_type: form.event_type,
        recurrence_rule: form.event_type === 'RECURRING' ? {
          frequency: form.recurrence_frequency,
          days_of_week: form.recurrence_days,
          end_date: form.recurrence_end_date ? new Date(form.recurrence_end_date).toISOString() : null,
        } : null,
        access_type: form.access_type,
        has_access_control: form.has_access_control,
        form_id: form.form_id || null,
        price: form.price ? parseFloat(form.price) : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      };

      if (isEditing) {
        const res = await apiFetch(`/api/events/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Evento actualizado');
      } else {
        const res = await apiFetch(`/api/bars/${barId}/events`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success('Evento creado');
      }
      resetForm();
      await loadData();
    } catch {
      toast.error(isEditing ? 'Error al actualizar evento' : 'Error al crear evento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este evento?')) return;
    await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    await loadData();
  };

  const toggleActive = async (ev: EventItem) => {
    try {
      const res = await apiFetch(`/api/events/${ev.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !ev.is_active }),
      });
      if (!res.ok) throw new Error();
      toast.success(ev.is_active ? 'Evento desactivado' : 'Evento activado');
      await loadData();
    } catch {
      toast.error('Error al cambiar estado del evento');
    }
  };

  const accessLabel: Record<string, string> = {
    FREE: 'Libre',
    FREE_WITH_FORM: 'Libre con formulario',
    PAID: 'Pagado',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-[#0f172a]">Eventos</h2>
        <button
          onClick={() => showForm && !isEditing ? resetForm() : startCreate()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo evento
        </button>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-[#0f172a]">{isEditing ? 'Editar evento' : 'Crear nuevo evento'}</h3>
              <p className="text-xs text-gray-400 mt-1">Completa los datos de tu evento</p>
            </div>
            {isEditing && (
              <button type="button" onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Seccion: Informacion basica */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Informacion basica</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Titulo del evento</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="Ej: Noche de Rock, After Office..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Descripcion</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Describe tu evento, que incluye, dress code, etc..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none resize-none transition"
                  />
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Imagen del evento <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <div className="flex items-center gap-4">
                    {form.image && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                        <img src={form.image} alt="Evento" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      {uploadingImage ? 'Subiendo...' : form.image ? 'Cambiar imagen' : 'Subir imagen'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {form.image && (
                      <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-xs text-red-500 hover:text-red-700">
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Seccion: Fecha y hora */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Fecha y hora</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Fecha de inicio</label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Fecha de fin <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Seccion: Tipo de evento */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Tipo de evento</p>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, event_type: 'SINGLE' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition ${
                    form.event_type === 'SINGLE'
                      ? 'border-[#0f172a] bg-[#0f172a] text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Unico
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, event_type: 'RECURRING' })}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition ${
                    form.event_type === 'RECURRING'
                      ? 'border-[#0f172a] bg-[#0f172a] text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Repeat className="w-4 h-4" /> Recurrente
                </button>
              </div>

              {form.event_type === 'RECURRING' && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Frecuencia</label>
                    <select
                      value={form.recurrence_frequency}
                      onChange={(e) => setForm({ ...form, recurrence_frequency: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
                    >
                      <option value="WEEKLY">Semanal</option>
                      <option value="BIWEEKLY">Quincenal</option>
                      <option value="MONTHLY">Mensual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Dias de la semana</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const days = form.recurrence_days.includes(day.value)
                              ? form.recurrence_days.filter(d => d !== day.value)
                              : [...form.recurrence_days, day.value];
                            setForm({ ...form, recurrence_days: days });
                          }}
                          className={`w-10 h-10 rounded-lg text-xs font-bold transition ${
                            form.recurrence_days.includes(day.value)
                              ? 'bg-[#0f172a] text-white'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Fecha de fin de recurrencia <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input
                      type="datetime-local"
                      value={form.recurrence_end_date}
                      onChange={(e) => setForm({ ...form, recurrence_end_date: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Seccion: Acceso y registro */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Acceso y registro</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Tipo de acceso</label>
                  <select
                    value={form.access_type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setForm({
                        ...form,
                        access_type: newType,
                        form_id: newType === 'FREE' ? '' : form.form_id,
                        price: newType === 'PAID' ? form.price : '',
                      });
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
                  >
                    <option value="FREE">Libre - registro con nombre y email</option>
                    <option value="FREE_WITH_FORM">Libre con formulario - registro con formulario personalizado</option>
                  </select>
                </div>

                {form.access_type !== 'FREE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Formulario de registro</label>
                    <select
                      value={form.form_id}
                      onChange={(e) => setForm({ ...form, form_id: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
                    >
                      <option value="">Seleccionar formulario...</option>
                      {formOptions.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    {formOptions.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1.5">No tenes formularios creados. Anda a la seccion Formularios para crear uno.</p>
                    )}
                  </div>
                )}

                {form.access_type === 'PAID' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">Precio de la entrada</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="0.00"
                        className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Seccion: Configuracion */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">Configuracion</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Capacidad maxima <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="Sin limite"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Dejalo vacio para no limitar registros</p>
                </div>
                <div className="flex items-center pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.has_access_control}
                      onChange={(e) => setForm({ ...form, has_access_control: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#0f172a] rounded-full peer peer-checked:bg-[#0f172a] transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                  </label>
                  <span className="ml-3 text-sm font-medium text-gray-900">Control de acceso QR</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <MonitorSmartphone className="w-4 h-4" /> Vista previa
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-[#fafafa] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition-colors disabled:opacity-50"
              >
                {loading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar cambios' : 'Crear evento')}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPreview(false)}>
          <div className="bg-gray-50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Preview header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-[#0f172a]">Vista previa del evento</span>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Preview content - mimics public event page */}
            <div>
              {/* Event image */}
              {form.image && (
                <div className="w-full h-44 bg-gray-200">
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Title */}
                <div>
                  <h1 className="text-xl font-bold text-[#0f172a] leading-tight">
                    {form.title || 'Titulo del evento'}
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">Organizado por <span className="text-[#0f172a] font-medium">Tu bar</span></p>
                </div>

                {/* Event details card */}
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white flex flex-col items-center justify-center flex-shrink-0">
                      {form.start_date ? (
                        <>
                          <span className="text-[10px] font-medium uppercase leading-none">
                            {new Date(form.start_date).toLocaleDateString('es-AR', { month: 'short' })}
                          </span>
                          <span className="text-sm font-bold leading-none">{new Date(form.start_date).getDate()}</span>
                        </>
                      ) : (
                        <CalendarDays className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      {form.start_date ? (
                        <>
                          <p className="text-sm font-medium text-[#0f172a] capitalize">
                            {new Date(form.start_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(form.start_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            {form.end_date ? ` - ${new Date(form.end_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">Fecha no definida</p>
                      )}
                    </div>
                  </div>

                  {form.event_type === 'RECURRING' && form.recurrence_days.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600 font-medium">
                        {form.recurrence_frequency === 'WEEKLY' ? 'Semanal' : form.recurrence_frequency === 'BIWEEKLY' ? 'Quincenal' : 'Mensual'}
                        {' - '}
                        {form.recurrence_days.map(d => {
                          const map: Record<string, string> = { MON: 'Lun', TUE: 'Mar', WED: 'Mie', THU: 'Jue', FRI: 'Vie', SAT: 'Sab', SUN: 'Dom' };
                          return map[d] || d;
                        }).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {form.description && (
                  <div className="bg-white rounded-2xl shadow-sm p-4">
                    <h2 className="text-sm font-semibold text-[#0f172a] mb-2">Acerca del evento</h2>
                    <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{form.description}</p>
                  </div>
                )}

                {/* Price & capacity */}
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="text-center mb-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Inscripcion</p>
                    {form.price && parseFloat(form.price) > 0 ? (
                      <p className="text-2xl font-bold text-[#0f172a] mt-1">${parseFloat(form.price).toFixed(2)}</p>
                    ) : (
                      <p className="text-xl font-bold text-green-600 mt-1">Gratis</p>
                    )}
                  </div>

                  {form.capacity && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                        <span>Capacidad ({form.capacity} cupos)</span>
                        <span className="font-medium text-[#0f172a]">0 / {form.capacity} disponibles</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 rounded-full bg-[#0f172a]" style={{ width: '0%' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Registration form preview */}
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <h2 className="text-base font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-gray-400" /> Registrarse
                  </h2>

                  <div className="space-y-4">
                    {form.access_type !== 'FREE' && previewFormFields.length > 0 ? (
                      previewFormFields.map((field, i) => (
                        <div key={i}>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {field.type === 'select' ? (
                            <select disabled className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400">
                              <option>Seleccionar</option>
                              {field.options?.map((opt) => (
                                <option key={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field.type === 'checkbox' ? (
                            <label className="flex items-center gap-2 text-sm text-gray-400">
                              <input type="checkbox" disabled className="rounded" />
                              {field.label}
                            </label>
                          ) : (
                            <input
                              type="text"
                              disabled
                              placeholder={field.label}
                              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400"
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nombre completo <span className="text-red-500">*</span>
                          </label>
                          <input type="text" disabled placeholder="Nombre completo" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input type="text" disabled placeholder="email@ejemplo.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Telefono
                          </label>
                          <input type="text" disabled placeholder="+54 11 1234-5678" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400" />
                        </div>
                      </>
                    )}

                    <button
                      type="button"
                      disabled
                      className="w-full bg-[#0f172a] text-white py-3.5 rounded-xl text-sm font-medium opacity-75 cursor-not-allowed"
                    >
                      Registrarme
                    </button>
                  </div>
                </div>

                {/* QR note */}
                {form.has_access_control && (
                  <p className="text-xs text-center text-gray-400">
                    Al registrarse, el asistente recibira un codigo QR para presentar en la entrada.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {events.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
          No hay eventos. Crea tu primer evento.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className={`bg-white rounded-2xl shadow-sm hover:shadow-md p-5 transition-shadow ${editingId === ev.id ? 'ring-2 ring-[#0f172a]' : ''} ${!ev.is_active ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#0f172a] text-lg">{ev.title}</p>
                    {ev.event_type === 'RECURRING' && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1"><Repeat className="w-3 h-3" /> Recurrente</span>
                    )}
                    {!ev.is_active && (
                      <span className="bg-gray-200 text-gray-500 px-2 py-0.5 rounded-lg text-xs font-medium">Inactivo</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(ev.start_date).toLocaleDateString('es-AR', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">{accessLabel[ev.access_type]}</span>
                    {ev.has_access_control && <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">QR</span>}
                    {ev.price != null && ev.price > 0 && <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">${ev.price}</span>}
                    {ev.capacity && <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-medium">Cap: {ev.capacity}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-center mr-2">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      <Users className="w-4 h-4" />
                      {ev.registered_count}
                    </div>
                    <p className="text-xs text-gray-400">registros</p>
                  </div>
                  <button
                    onClick={() => toggleActive(ev)}
                    className={`p-2 rounded-xl transition-colors ${ev.is_active ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-amber-500 hover:text-green-600 hover:bg-green-50'}`}
                    title={ev.is_active ? 'Desactivar evento' : 'Activar evento'}
                  >
                    {ev.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(ev)}
                    className="p-2 text-gray-400 hover:text-[#0f172a] hover:bg-gray-100 rounded-xl transition-colors"
                    title="Editar evento"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <a
                    href={`/event/${ev.id}`}
                    target="_blank"
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-[#fafafa] rounded-xl transition-colors"
                    title="Ver pagina publica"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => handleDelete(ev.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
