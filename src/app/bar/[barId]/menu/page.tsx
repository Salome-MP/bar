'use client'

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UtensilsCrossed, Coffee, Beer, Wine, Sandwich } from 'lucide-react';

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

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('cerveza')) return Beer;
  if (n.includes('trago') || n.includes('coctel') || n.includes('cocktail')) return Wine;
  if (n.includes('bebida') || n.includes('cafe') || n.includes('jugo') || n.includes('refresco')) return Coffee;
  if (n.includes('comida') || n.includes('plato') || n.includes('entrada') || n.includes('picada') || n.includes('sandwich') || n.includes('hamburguesa') || n.includes('snack') || n.includes('postre')) return Sandwich;
  if (n.includes('vino')) return Wine;
  return UtensilsCrossed;
}

export default function MenuPublicPage() {
  const params = useParams();
  const barId = params.barId as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [barName, setBarName] = useState('');
  const [barLogo, setBarLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!barId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [menuRes, barRes] = await Promise.all([
          fetch(`/api/bars/${barId}/menu`),
          fetch(`/api/bars/${barId}`),
        ]);
        const menuData = await menuRes.json();
        if (Array.isArray(menuData)) {
          setCategories(menuData);
        } else {
          setCategories(menuData.categories || []);
        }
        const barData = await barRes.json();
        setBarName(barData.name || '');
        setBarLogo(barData.logo || '');
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [barId]);

  const visibleCategories = categories
    .map((cat) => ({ ...cat, items: cat.items.filter((item) => item.available) }))
    .filter((cat) => cat.items.length > 0);

  useEffect(() => {
    if (visibleCategories.length > 0 && !activeCategory) {
      setActiveCategory(visibleCategories[0].id);
    }
  }, [visibleCategories, activeCategory]);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    const el = categoryRefs.current[catId];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      for (const cat of visibleCategories) {
        const el = categoryRefs.current[cat.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom > 100) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCategories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    );
  }

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
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5">
          <Link
            href={`/bar/${barId}`}
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-[#0f172a] text-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al bar
          </Link>
        </div>

        {/* Bar info + title */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0f172a] flex items-center justify-center overflow-hidden flex-shrink-0">
              {barLogo ? (
                <img src={barLogo} alt={barName} className="w-full h-full object-cover" />
              ) : (
                <UtensilsCrossed className="w-5 h-5 text-white/60" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">{barName}</h1>
              <p className="text-sm text-gray-400">Carta digital</p>
            </div>
          </div>
        </div>

        {/* Two column layout */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex gap-6">

            {/* Left sidebar: categories */}
            {visibleCategories.length > 0 && (
              <div className="hidden lg:block w-56 flex-shrink-0">
                <div className="sticky top-[76px]">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Categorias</p>
                    <div className="space-y-1">
                      {visibleCategories.map((cat) => {
                        const Icon = getCategoryIcon(cat.name);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => scrollToCategory(cat.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                              activeCategory === cat.id
                                ? 'bg-[#0f172a] text-white font-medium shadow-sm'
                                : 'text-gray-500 hover:text-[#0f172a] hover:bg-gray-50'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span className="flex-1">{cat.name}</span>
                              <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                                activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {cat.items.length}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile category tabs */}
            {visibleCategories.length > 0 && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-lg border-t border-gray-200 px-4 py-2.5 flex gap-1.5 overflow-x-auto scrollbar-hide">
                {visibleCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.name);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        activeCategory === cat.id
                          ? 'bg-[#0f172a] text-white'
                          : 'text-gray-400 bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Right: menu items */}
            <div className="flex-1 min-w-0">
              {visibleCategories.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <UtensilsCrossed className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">El menu esta vacio</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {visibleCategories.map((cat) => (
                    <div
                      key={cat.id}
                      ref={(el) => { categoryRefs.current[cat.id] = el; }}
                    >
                      {/* Category header */}
                      {(() => { const Icon = getCategoryIcon(cat.name); return (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-[#0f172a]">{cat.name}</h3>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{cat.items.length} items</span>
                      </div>
                      ); })()}

                      {/* Items grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {cat.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition group border border-gray-100"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#0f172a] text-[15px] group-hover:text-blue-600 transition">{item.name}</p>
                                {item.description && (
                                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                              <span className="text-lg font-bold text-[#0f172a]">${item.price.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
