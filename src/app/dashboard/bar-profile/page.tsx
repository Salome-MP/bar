'use client'

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Save, Loader2, Camera, Plus, Trash2, ImageIcon, Film, Clock } from 'lucide-react';

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

type WeekSchedule = Record<string, DaySchedule>;

const DAYS = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miercoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sabado' },
  { key: 'dom', label: 'Domingo' },
];

const defaultSchedule: WeekSchedule = Object.fromEntries(
  DAYS.map((d) => [d.key, { open: '18:00', close: '02:00', closed: false }])
);

function parseSchedule(raw: unknown): WeekSchedule {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (obj.lun || obj.mar || obj.mie) return raw as WeekSchedule;
  }
  return { ...defaultSchedule };
}

interface BarProfile {
  name: string;
  description: string;
  address: string;
  phone: string;
  logo: string;
  cover_image: string;
  social_media: {
    instagram: string;
    facebook: string;
    twitter: string;
  };
  schedule: WeekSchedule;
}

interface GalleryItem {
  id: string;
  url: string;
  caption: string | null;
  type: 'IMAGE' | 'VIDEO';
  order: number;
}

const emptyProfile: BarProfile = {
  name: '',
  description: '',
  address: '',
  phone: '',
  logo: '',
  cover_image: '',
  social_media: { instagram: '', facebook: '', twitter: '' },
  schedule: { ...defaultSchedule },
};

type Tab = 'perfil' | 'galeria';

export default function BarProfilePage() {
  const { user } = useAuthStore();
  const barId = user?.bar_id;

  const [tab, setTab] = useState<Tab>('perfil');
  const [form, setForm] = useState<BarProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (!barId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [barRes, galleryRes] = await Promise.all([
          apiFetch(`/api/bars/${barId}`),
          apiFetch(`/api/bars/${barId}/gallery`),
        ]);
        const data = await barRes.json();
        setForm({
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          logo: data.logo || '',
          cover_image: data.cover_image || '',
          social_media: {
            instagram: data.social_media?.instagram || '',
            facebook: data.social_media?.facebook || '',
            twitter: data.social_media?.twitter || '',
          },
          schedule: parseSchedule(data.schedule),
        });
        if (galleryRes.ok) setGalleryItems(await galleryRes.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [barId]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiFetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail);
      }
      const { url } = await res.json();
      setForm({ ...form, cover_image: url });
      toast.success('Portada subida');
    } catch (err: any) {
      toast.error(err.message || 'Error al subir portada');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barId) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/bars/${barId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          cover_image: form.cover_image || null,
          social_media: {
            instagram: form.social_media.instagram || null,
            facebook: form.social_media.facebook || null,
            twitter: form.social_media.twitter || null,
          },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Perfil guardado');
    } catch {
      toast.error('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  // Gallery handlers
  const loadGallery = async () => {
    if (!barId) return;
    const res = await apiFetch(`/api/bars/${barId}/gallery`);
    if (res.ok) setGalleryItems(await res.json());
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !barId) return;
    setUploadingGallery(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await apiFetch('/api/upload', { method: 'POST', body: fd });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.detail || 'Error al subir');
      }
      const { url, type } = await uploadRes.json();

      const galleryRes = await apiFetch(`/api/bars/${barId}/gallery`, {
        method: 'POST',
        body: JSON.stringify({ url, type, caption: caption || null }),
      });
      if (!galleryRes.ok) throw new Error('Error al guardar');

      setCaption('');
      toast.success('Archivo subido');
      await loadGallery();
    } catch (err: any) {
      toast.error(err.message || 'Error al subir archivo');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm('Eliminar este archivo?')) return;
    if (!barId) return;
    await apiFetch(`/api/bars/${barId}/gallery/${id}`, { method: 'DELETE' });
    await loadGallery();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>;
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition";

  const tabs: { key: Tab; label: string }[] = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'galeria', label: 'Galeria' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#0f172a]">Mi Bar</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white text-[#0f172a] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Perfil tab */}
      {tab === 'perfil' && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-8 space-y-6 max-w-2xl">
          {/* Foto de perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Foto de perfil</label>
            <p className="text-xs text-gray-400 mb-3">Esta imagen se muestra como fondo en la tarjeta de tu bar</p>
            <div className="relative group w-full h-40 rounded-xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155]">
              {form.cover_image ? (
                <img src={form.cover_image} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                <label className={`opacity-0 group-hover:opacity-100 transition flex items-center gap-2 px-4 py-2 bg-white/90 text-[#0f172a] rounded-xl text-sm font-medium cursor-pointer hover:bg-white ${uploadingCover ? '!opacity-100' : ''}`}>
                  {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {uploadingCover ? 'Subiendo...' : form.cover_image ? 'Cambiar foto' : 'Subir foto'}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploadingCover} />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Descripcion</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Direccion</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Telefono</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Horario</label>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              {DAYS.map((day) => {
                const ds = form.schedule[day.key] || { open: '18:00', close: '02:00', closed: false };
                const updateDay = (patch: Partial<DaySchedule>) => {
                  setForm({
                    ...form,
                    schedule: { ...form.schedule, [day.key]: { ...ds, ...patch } },
                  });
                };
                return (
                  <div
                    key={day.key}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${ds.closed ? 'bg-gray-100/60' : 'bg-white border border-gray-100'}`}
                  >
                    <span className={`w-20 text-sm font-medium ${ds.closed ? 'text-gray-400' : 'text-gray-700'}`}>{day.label}</span>

                    {ds.closed ? (
                      <span className="text-xs text-gray-400 flex-1">Cerrado</span>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={ds.open}
                          onChange={(e) => updateDay({ open: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] bg-white"
                        />
                        <span className="text-xs text-gray-400">a</span>
                        <input
                          type="time"
                          value={ds.close}
                          onChange={(e) => updateDay({ close: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] bg-white"
                        />
                      </div>
                    )}

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => updateDay({ closed: !ds.closed })}
                      className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${ds.closed ? 'bg-gray-300' : 'bg-green-500'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${ds.closed ? 'left-0.5' : 'left-[18px]'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium text-gray-900 mb-4">Redes sociales</p>
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Instagram</label>
                <input value={form.social_media.instagram} onChange={(e) => setForm({ ...form, social_media: { ...form.social_media, instagram: e.target.value } })} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Facebook</label>
                <input value={form.social_media.facebook} onChange={(e) => setForm({ ...form, social_media: { ...form.social_media, facebook: e.target.value } })} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Twitter</label>
                <input value={form.social_media.twitter} onChange={(e) => setForm({ ...form, social_media: { ...form.social_media, twitter: e.target.value } })} placeholder="https://twitter.com/..." className={inputClass} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      {/* Galeria tab */}
      {tab === 'galeria' && (
        <div className="max-w-3xl space-y-6">
          {/* Upload area */}
          <label className={`block bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200 hover:border-[#0f172a]/30 transition cursor-pointer ${uploadingGallery ? 'pointer-events-none opacity-60' : ''}`}>
            <div className="flex flex-col items-center justify-center py-10 px-6">
              {uploadingGallery ? (
                <Loader2 className="w-8 h-8 text-[#0f172a] animate-spin mb-3" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <p className="text-sm font-medium text-gray-900">
                {uploadingGallery ? 'Subiendo archivo...' : 'Arrastra o hace click para subir'}
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP o MP4. Imagenes hasta 5MB, videos hasta 50MB</p>
            </div>
            <input type="file" accept="image/*,video/mp4,video/webm" onChange={handleGalleryUpload} className="hidden" />
          </label>

          {/* Gallery grid */}
          {galleryItems.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Tu galeria esta vacia</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400">{galleryItems.length} {galleryItems.length === 1 ? 'archivo' : 'archivos'}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryItems.map((item) => (
                  <div key={item.id} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                    {item.type === 'VIDEO' ? (
                      <video src={item.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
                    )}
                    {item.type === 'VIDEO' && (
                      <div className="absolute top-2 left-2 bg-black/50 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                        <Film className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-medium">Video</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                      <button
                        onClick={() => handleDeleteGallery(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition p-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                        <span className="text-xs text-white">{item.caption}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
