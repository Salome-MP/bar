'use client'

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import {
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  QrCode,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  order: number;
}

interface Category {
  id: string;
  name: string;
  order: number;
  items: MenuItem[];
}

export default function MenuPage() {
  const { user } = useAuthStore();
  const barId = user?.bar_id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // Category form state
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ name: '', order: 0 });

  // Item form state
  const [showItemFormCatId, setShowItemFormCatId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    available: true,
    order: 0,
  });

  const loadCategories = async () => {
    if (!barId) return;
    try {
      const res = await apiFetch(`/api/bars/${barId}/menu`);
      const data = await res.json();
      setCategories(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        order: c.order,
        items: (c.items || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          available: i.available,
          order: i.order,
        })),
      })));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadQr = async () => {
    if (!barId) return;
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`/api/bars/${barId}/menu/qr`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await res.blob();
      setQrUrl(URL.createObjectURL(blob));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCategories();
    loadQr();
  }, [barId]);

  // --- Category CRUD ---
  const openCreateCategory = () => {
    setEditingCatId(null);
    setCatForm({ name: '', order: categories.length });
    setShowCatForm(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatForm({ name: cat.name, order: cat.order });
    setShowCatForm(true);
  };

  const handleSaveCategory = async () => {
    if (!barId || !catForm.name.trim()) return;
    try {
      if (editingCatId) {
        await apiFetch(`/api/menu/categories/${editingCatId}`, {
          method: 'PUT',
          body: JSON.stringify(catForm),
        });
      } else {
        await apiFetch(`/api/bars/${barId}/menu/categories`, {
          method: 'POST',
          body: JSON.stringify(catForm),
        });
      }
      setShowCatForm(false);
      await loadCategories();
    } catch {
      toast.error('Error al guardar categoria');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Eliminar esta categoria y todos sus items?')) return;
    try {
      await apiFetch(`/api/menu/categories/${catId}`, { method: 'DELETE' });
      await loadCategories();
    } catch {
      toast.error('Error al eliminar categoria');
    }
  };

  // --- Item CRUD ---
  const openCreateItem = (catId: string) => {
    setEditingItemId(null);
    setItemForm({ name: '', description: '', price: '', available: true, order: 0 });
    setShowItemFormCatId(catId);
  };

  const openEditItem = (catId: string, item: MenuItem) => {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      available: item.available,
      order: item.order,
    });
    setShowItemFormCatId(catId);
  };

  const handleSaveItem = async () => {
    if (!showItemFormCatId || !itemForm.name.trim() || !itemForm.price) return;
    const payload = {
      name: itemForm.name,
      description: itemForm.description || null,
      price: parseFloat(itemForm.price),
      available: itemForm.available,
      order: itemForm.order,
    };
    try {
      if (editingItemId) {
        await apiFetch(`/api/menu/items/${editingItemId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/api/menu/categories/${showItemFormCatId}/items`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowItemFormCatId(null);
      setEditingItemId(null);
      await loadCategories();
    } catch {
      toast.error('Error al guardar item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Eliminar este item?')) return;
    try {
      await apiFetch(`/api/menu/items/${itemId}`, { method: 'DELETE' });
      await loadCategories();
    } catch {
      toast.error('Error al eliminar item');
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await apiFetch(`/api/menu/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...item, available: !item.available }),
      });
      await loadCategories();
    } catch {
      toast.error('Error al actualizar disponibilidad');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Menu Digital</h2>
        <button
          onClick={openCreateCategory}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition"
        >
          <Plus className="w-4 h-4" />
          Nueva categoria
        </button>
      </div>

      {/* QR Code */}
      {qrUrl && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
          <img src={qrUrl} alt="QR Menu" className="w-24 h-24 rounded-xl" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <QrCode className="w-5 h-5 text-gray-400" /> Codigo QR del menu
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Tus clientes escanean este QR desde la mesa para ver la carta
            </p>
            <div className="flex items-center gap-2">
              <a
                href={qrUrl}
                download={`menu-qr-${barId}.png`}
                className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] text-white rounded-xl text-xs font-medium hover:bg-[#1e293b] transition"
              >
                Descargar QR
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/bar/${barId}/menu`);
                  toast.success('Enlace copiado');
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Copiar enlace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category form */}
      {showCatForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingCatId ? 'Editar categoria' : 'Nueva categoria'}
          </h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-2">Nombre</label>
              <input
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition"
                placeholder="Ej: Tragos"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-900 mb-2">Orden</label>
              <input
                type="number"
                value={catForm.order}
                onChange={(e) => setCatForm({ ...catForm, order: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition"
              />
            </div>
            <button
              onClick={handleSaveCategory}
              className="flex items-center gap-2 px-5 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition"
            >
              <Check className="w-4 h-4" /> Guardar
            </button>
            <button
              onClick={() => setShowCatForm(false)}
              className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Categories and items */}
      {categories.length === 0 && !showCatForm ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center text-gray-400">
          No hay categorias. Crea tu primera categoria para armar el menu.
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-300" />
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {cat.items.length} item{cat.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCreateItem(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f172a] text-white rounded-lg text-xs font-medium hover:bg-[#1e293b] transition"
                  >
                    <Plus className="w-3 h-3" /> Item
                  </button>
                  <button
                    onClick={() => openEditCategory(cat)}
                    className="text-gray-400 hover:text-gray-900 transition p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-gray-400 hover:text-red-500 transition p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Item form */}
              {showItemFormCatId === cat.id && (
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">
                    {editingItemId ? 'Editar item' : 'Nuevo item'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1.5">Nombre</label>
                      <input
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-900 mb-1.5">Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-900 mb-1.5">Descripcion</label>
                    <input
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition"
                    />
                  </div>
                  <div className="flex items-center gap-6 mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={itemForm.available}
                        onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })}
                        className="rounded"
                      />
                      Disponible
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-900">Orden</label>
                      <input
                        type="number"
                        value={itemForm.order}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, order: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] transition"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveItem}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition"
                    >
                      <Check className="w-4 h-4" /> Guardar
                    </button>
                    <button
                      onClick={() => {
                        setShowItemFormCatId(null);
                        setEditingItemId(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                    >
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Items list */}
              {cat.items.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium text-sm ${!item.available ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {item.name}
                          </p>
                          {!item.available && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">
                              No disponible
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <span className="font-semibold text-sm text-gray-900">
                          ${item.price.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleToggleAvailable(item)}
                          className={`transition ${item.available ? 'text-[#0f172a]' : 'text-gray-200'}`}
                          title={item.available ? 'Desactivar' : 'Activar'}
                        >
                          {item.available ? (
                            <ToggleRight className="w-6 h-6" />
                          ) : (
                            <ToggleLeft className="w-6 h-6" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditItem(cat.id, item)}
                          className="text-gray-400 hover:text-gray-900 transition p-1"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-sm text-gray-400">
                  Sin items en esta categoria
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
