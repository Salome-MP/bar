'use client'

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, ImageIcon, Film, Loader2 } from 'lucide-react';

interface GalleryItem {
  id: string;
  url: string;
  caption: string | null;
  type: 'IMAGE' | 'VIDEO';
  order: number;
}

export default function GalleryPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');

  const barId = user?.bar_id;

  const loadGallery = async () => {
    if (!barId) return;
    const res = await apiFetch(`/api/bars/${barId}/gallery`);
    if (res.ok) setItems(await res.json());
  };

  useEffect(() => { loadGallery(); }, [barId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !barId) return;
    setUploading(true);
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
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este archivo?')) return;
    if (!barId) return;
    await apiFetch(`/api/bars/${barId}/gallery/${id}`, { method: 'DELETE' });
    await loadGallery();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-[#0f172a]">Galeria</h2>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <p className="text-sm font-medium text-gray-900 mb-4">Subir foto o video</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Descripcion (opcional)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#0f172a] focus:border-transparent outline-none transition"
          />
          <label className={`flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? 'Subiendo...' : 'Elegir archivo'}
            <input type="file" accept="image/*,video/mp4,video/webm" onChange={handleUpload} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-2">Imagenes hasta 5MB, videos hasta 50MB</p>
      </div>

      {/* Gallery grid */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-900">No hay fotos ni videos</p>
          <p className="text-sm text-gray-400 mt-1">Subi contenido para mostrar en el perfil publico de tu bar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative group bg-white rounded-xl shadow-sm overflow-hidden">
              {item.type === 'VIDEO' ? (
                <video src={item.url} className="w-full h-40 object-cover" muted />
              ) : (
                <img src={item.url} alt={item.caption || ''} className="w-full h-40 object-cover" />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end">
                <div className="w-full p-2 opacity-0 group-hover:opacity-100 transition flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {item.type === 'VIDEO' ? <Film className="w-3 h-3 text-white" /> : <ImageIcon className="w-3 h-3 text-white" />}
                    {item.caption && <span className="text-xs text-white truncate max-w-[120px]">{item.caption}</span>}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-3 h-3" />
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
