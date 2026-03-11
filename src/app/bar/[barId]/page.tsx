'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Phone, Clock, ArrowRight, ArrowLeft,
  UtensilsCrossed, Instagram, Facebook, Twitter, Users,
  Repeat, Film, CalendarDays, ChevronRight,
} from 'lucide-react';

interface BarInfo {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  cover_image: string | null;
  address: string | null;
  phone: string | null;
  schedule: Record<string, { open: string; close: string; closed: boolean }> | string | null;
  social_media: {
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
  } | null;
}

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  start_date: string;
  event_type: string;
  recurrence_rule: { frequency: string; days_of_week: string[] } | null;
  access_type: string;
  price: number | null;
  capacity: number | null;
  registered_count: number;
}

interface GalleryItem {
  id: string;
  url: string;
  caption: string | null;
  type: 'IMAGE' | 'VIDEO';
}

export default function BarProfilePublicPage() {
  const params = useParams();
  const barId = params.barId as string;
  const [bar, setBar] = useState<BarInfo | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [barRes, eventsRes, galleryRes] = await Promise.all([
          fetch(`/api/bars/${barId}`),
          fetch(`/api/bars/${barId}/events`),
          fetch(`/api/bars/${barId}/gallery`),
        ]);
        setBar(await barRes.json());
        setEvents(await eventsRes.json());
        if (galleryRes.ok) setGallery(await galleryRes.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [barId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Cargando...
      </div>
    );
  }

  if (!bar) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#0f172a]">Bar no encontrado</p>
          <Link href="/bars" className="text-gray-500 hover:text-[#0f172a] font-medium text-sm mt-3 inline-block">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  const socials = bar.social_media || {};

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
          <Link href="/bars" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-[#0f172a] text-sm transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a bares
          </Link>
        </div>

        {/* Main content: two column on desktop */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">

            {/* Left column: bar info */}
            <div className="lg:w-[380px] flex-shrink-0 space-y-4">
              {/* Bar card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Banner */}
                <div className="h-40 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] relative overflow-hidden">
                  {bar.cover_image ? (
                    <img src={bar.cover_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
                      <div className="absolute -bottom-10 -left-6 w-28 h-28 bg-white/5 rounded-full" />
                    </>
                  )}
                </div>

                <div className="pt-5 px-5 pb-5">
                  <h1 className="text-2xl font-bold text-[#0f172a]">{bar.name}</h1>
                  {bar.description && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{bar.description}</p>
                  )}

                  {/* Social */}
                  {(socials.instagram || socials.facebook || socials.twitter) && (
                    <div className="flex gap-2 mt-4">
                      {socials.instagram && (
                        <a href={socials.instagram} target="_blank" rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#0f172a] hover:bg-gray-200 transition">
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {socials.facebook && (
                        <a href={socials.facebook} target="_blank" rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#0f172a] hover:bg-gray-200 transition">
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {socials.twitter && (
                        <a href={socials.twitter} target="_blank" rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#0f172a] hover:bg-gray-200 transition">
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}

                  <hr className="my-4 border-gray-100" />

                  {/* Details */}
                  <div className="space-y-3">
                    {bar.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{bar.address}</span>
                      </div>
                    )}
                    {bar.schedule && typeof bar.schedule === 'object' && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        <div className="text-sm text-gray-600 space-y-0.5">
                          {Object.entries(bar.schedule as Record<string, { open: string; close: string; closed: boolean }>).map(([key, val]) => {
                            const labels: Record<string, string> = { lun: 'Lun', mar: 'Mar', mie: 'Mie', jue: 'Jue', vie: 'Vie', sab: 'Sab', dom: 'Dom' };
                            return (
                              <div key={key} className="flex gap-2">
                                <span className="w-8 font-medium text-gray-500">{labels[key] || key}</span>
                                {val.closed ? (
                                  <span className="text-gray-400">Cerrado</span>
                                ) : (
                                  <span>{val.open} - {val.close}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {bar.schedule && typeof bar.schedule === 'string' && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{bar.schedule}</span>
                      </div>
                    )}
                    {bar.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{bar.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu link */}
              <Link
                href={`/bar/${barId}/menu`}
                className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f172a] flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f172a] text-sm">Ver carta completa</p>
                    <p className="text-[11px] text-gray-400">Menu digital del bar</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 group-hover:text-[#0f172a] transition-all" />
              </Link>
            </div>

            {/* Right column: events + gallery */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Gallery */}
              {gallery.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Galeria</p>
                  <div className={`grid gap-2 ${
                    gallery.length === 1 ? 'grid-cols-1' :
                    gallery.length === 2 ? 'grid-cols-2' :
                    'grid-cols-3'
                  }`}>
                    {gallery.map((item, idx) => {
                      const isFirst = idx === 0 && gallery.length >= 3;
                      return (
                        <div
                          key={item.id}
                          className={`relative rounded-xl overflow-hidden bg-gray-100 group cursor-pointer ${
                            isFirst ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square'
                          }`}
                        >
                          {item.type === 'VIDEO' ? (
                            <video src={item.url} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          )}
                          {item.type === 'VIDEO' && (
                            <div className="absolute top-2 left-2 bg-black/50 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                              <Film className="w-3 h-3 text-white" />
                              <span className="text-[10px] text-white font-medium">Video</span>
                            </div>
                          )}
                          {item.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2.5 pt-8 opacity-0 group-hover:opacity-100 transition">
                              <span className="text-xs text-white">{item.caption}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Events */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Proximos eventos</p>
                  <span className="text-xs text-gray-400">{events.length} eventos</span>
                </div>

                {events.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
                    <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No hay eventos proximos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((ev) => {
                      const date = new Date(ev.start_date);
                      const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                      const fullDate = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
                      const isFull = ev.capacity ? ev.registered_count >= ev.capacity : false;

                      return (
                        <Link
                          key={ev.id}
                          href={`/event/${ev.id}`}
                          className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden group"
                        >
                          {/* Event image if exists */}
                          {ev.image && (
                            <img src={ev.image} alt={ev.title} className="w-full h-36 object-cover" />
                          )}

                          <div className="p-4">
                            <div className="flex items-start gap-4">
                              {/* Date block */}
                              <div className="w-14 h-14 rounded-xl bg-[#0f172a] text-white flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-medium text-slate-400 uppercase">
                                  {date.toLocaleDateString('es-AR', { month: 'short' })}
                                </span>
                                <span className="text-xl font-bold leading-none">{date.getDate()}</span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#0f172a] text-base leading-tight">{ev.title}</h3>
                                <p className="text-xs text-gray-400 mt-1 capitalize">{fullDate} - {time}</p>
                                {ev.description && (
                                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{ev.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Bottom row */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                {ev.price && ev.price > 0 ? (
                                  <span className="text-sm font-bold text-[#0f172a] bg-gray-100 px-3 py-1 rounded-lg">${ev.price}</span>
                                ) : (
                                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg">Gratis</span>
                                )}
                                {ev.event_type === 'RECURRING' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                    <Repeat className="w-3 h-3" /> Recurrente
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                {ev.capacity && (
                                  <span className={`flex items-center gap-1 text-xs font-medium ${isFull ? 'text-red-500' : 'text-gray-400'}`}>
                                    <Users className="w-3.5 h-3.5" />
                                    {isFull ? 'Agotado' : `${ev.registered_count}/${ev.capacity}`}
                                  </span>
                                )}
                                <span className="text-xs font-medium text-[#0f172a] group-hover:underline flex items-center gap-0.5">
                                  Ver detalles <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
