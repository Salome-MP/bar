'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, CalendarDays, Star, ArrowRight } from 'lucide-react';

interface BarData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  cover_image: string | null;
  address: string | null;
  schedule: string | null;
  event_count: number;
  next_event: { title: string; date: string } | null;
}

export default function BarsPage() {
  const [bars, setBars] = useState<BarData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/bars');
        setBars(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = search
    ? bars.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.address?.toLowerCase().includes(search.toLowerCase())
      )
    : bars;

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
        {/* Hero search */}
        <div className="bg-[#0f172a] pb-10 pt-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Encontra tu proximo plan
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">Bares, eventos y la mejor noche te esperan</p>

            <div className="relative mt-6 max-w-lg mx-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar bar por nombre o ubicacion..."
                className="w-full bg-white rounded-2xl pl-11 pr-4 py-4 text-sm text-[#0f172a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xl shadow-black/20"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
          {loading ? (
            <div className="text-center py-20 text-gray-400 text-sm">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-16 text-center mt-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-900 text-lg">No se encontraron bares</p>
              {search && <p className="text-sm text-gray-400 mt-1">Proba con otro termino de busqueda</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((bar) => (
                <Link
                  key={bar.id}
                  href={`/bar/${bar.id}`}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
                >
                  {/* Top visual */}
                  <div className="h-32 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] relative overflow-hidden">
                    {bar.cover_image ? (
                      <img src={bar.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-8 -left-4 w-20 h-20 bg-white/5 rounded-full" />
                      </>
                    )}

                    {/* Logo centered */}
                    {!bar.cover_image && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-18 h-18 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden" style={{ width: '72px', height: '72px' }}>
                          <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none">
                            <path d="M8 22L24 10L40 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                            <rect x="12" y="22" width="24" height="16" rx="2" stroke="white" strokeWidth="2" opacity="0.7"/>
                            <rect x="20" y="28" width="8" height="10" rx="1" stroke="white" strokeWidth="1.5" opacity="0.9"/>
                            <rect x="14" y="25" width="5" height="4" rx="0.5" fill="white" opacity="0.4"/>
                            <rect x="29" y="25" width="5" height="4" rx="0.5" fill="white" opacity="0.4"/>
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Event count badge */}
                    {bar.event_count > 0 && (
                      <div className="absolute top-3 right-3 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {bar.event_count}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-bold text-[#0f172a] text-lg leading-tight">{bar.name}</h2>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0f172a] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                    </div>

                    {bar.description && (
                      <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{bar.description}</p>
                    )}

                    {bar.address && (
                      <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{bar.address}</span>
                      </p>
                    )}

                    {/* Next event teaser */}
                    {bar.next_event && (
                      <div className="mt-3 bg-blue-50 rounded-xl px-3 py-2 flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0f172a] rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-white leading-none">
                            {new Date(bar.next_event.date).getDate()}
                          </span>
                          <span className="text-[7px] text-slate-400 uppercase font-medium">
                            {new Date(bar.next_event.date).toLocaleDateString('es-AR', { month: 'short' })}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">Proximo evento</p>
                          <p className="text-xs text-[#0f172a] font-medium truncate">{bar.next_event.title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-slate-400 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="font-semibold text-white">AppBar</span>
          <p className="text-sm">2026 AppBar. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
