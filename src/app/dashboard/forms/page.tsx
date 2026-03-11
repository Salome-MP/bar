'use client'

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, ClipboardList, Pencil, X } from 'lucide-react';

interface FormField {
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface FormItem {
  id: string;
  name: string;
  fields: FormField[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefono' },
  { value: 'number', label: 'Numero' },
  { value: 'select', label: 'Seleccion' },
  { value: 'checkbox', label: 'Casilla' },
];

const DEFAULT_FIELDS: FormField[] = [
  { type: 'text', label: 'Nombre completo', required: true },
  { type: 'email', label: 'Email', required: true },
];

export default function FormsPage() {
  const { user } = useAuthStore();
  const [forms, setForms] = useState<FormItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [loading, setLoading] = useState(false);

  const barId = user?.bar_id;
  const isEditing = editingId !== null;

  const loadForms = async () => {
    if (!barId) return;
    const res = await apiFetch(`/api/bars/${barId}/forms`);
    const data = await res.json();
    setForms(data);
  };

  useEffect(() => {
    loadForms();
  }, [barId]);

  const resetForm = () => {
    setFormName('');
    setFields(DEFAULT_FIELDS.map(f => ({ ...f })));
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (form: FormItem) => {
    setEditingId(form.id);
    setFormName(form.name);
    setFields(form.fields.map(f => ({ ...f })));
    setShowForm(true);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const addField = () => {
    setFields([...fields, { type: 'text', label: '', required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barId) return;
    setLoading(true);
    try {
      if (isEditing) {
        const res = await apiFetch(`/api/forms/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: formName, fields }),
        });
        if (!res.ok) throw new Error();
        toast.success('Formulario actualizado');
      } else {
        const res = await apiFetch(`/api/bars/${barId}/forms`, {
          method: 'POST',
          body: JSON.stringify({ name: formName, fields }),
        });
        if (!res.ok) throw new Error();
        toast.success('Formulario creado');
      }
      resetForm();
      await loadForms();
    } catch {
      toast.error(isEditing ? 'Error al actualizar formulario' : 'Error al crear formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este formulario?')) return;
    await apiFetch(`/api/forms/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    await loadForms();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-[#0f172a]">Formularios</h2>
        <button
          onClick={() => showForm && !isEditing ? resetForm() : startCreate()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo formulario
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-[#0f172a]">{isEditing ? 'Editar formulario' : 'Crear nuevo formulario'}</h3>
              <p className="text-xs text-gray-400 mt-1">Diseña las preguntas que veran los asistentes al registrarse</p>
            </div>
            {isEditing && (
              <button type="button" onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="p-6 space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Nombre del formulario</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="Ej: Registro VIP, Inscripcion cata..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
              />
              <p className="text-xs text-gray-400 mt-1.5">Este nombre es interno, el asistente no lo ve</p>
            </div>

            <hr className="border-gray-100" />

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Campos del formulario</p>
              <p className="text-xs text-gray-400 mb-4">Cada campo es una pregunta que le haces al asistente</p>

              <div className="space-y-3">
                {fields.map((field, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 bg-[#fafafa]">
                    <div className="flex items-center gap-2 mb-3">
                      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-400 bg-gray-200 px-2 py-0.5 rounded-lg">Campo {i + 1}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto_auto] gap-3 items-center">
                      <select
                        value={field.type}
                        onChange={(e) => updateField(i, { type: e.target.value })}
                        className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition bg-white"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <input
                        value={field.label}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        placeholder="Nombre del campo (ej: Edad, DNI, Telefono...)"
                        required
                        className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition bg-white"
                      />
                      <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(i, { required: e.target.checked })}
                          className="rounded accent-[#0f172a]"
                        />
                        Obligatorio
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(i)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {field.type === 'select' && (
                      <div className="mt-3 ml-6">
                        <label className="block text-xs text-gray-400 mb-1">Opciones (separar con coma)</label>
                        <input
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateField(i, { options: e.target.value.split(',').map(s => s.trim()) })}
                          placeholder="Ej: General, VIP, Estudiante"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition bg-white"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addField}
                className="mt-4 flex items-center gap-2 text-sm text-[#0f172a] hover:text-[#1e293b] font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar campo
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
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
              {loading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar cambios' : 'Crear formulario')}
            </button>
          </div>
        </form>
      )}

      {forms.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-900">No hay formularios creados</p>
          <p className="text-sm text-gray-400 mt-1">Crea uno para usarlo en tus eventos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <div key={form.id} className={`bg-white rounded-2xl shadow-sm hover:shadow-md p-5 transition-shadow ${editingId === form.id ? 'ring-2 ring-[#0f172a]' : ''}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[#0f172a]">{form.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">{form.fields.length} campos</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-xs text-gray-400">{form.fields.map(f => f.label).join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(form)}
                    className="p-2 text-gray-400 hover:text-[#0f172a] hover:bg-gray-100 rounded-xl transition-colors"
                    title="Editar formulario"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar formulario"
                  >
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
