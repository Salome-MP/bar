import Link from 'next/link';
import {
  CalendarDays,
  QrCode,
  ClipboardList,
  CreditCard,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Sparkles,
  Music,
  Wine,
} from 'lucide-react';

const features = [
  {
    icon: CalendarDays,
    title: 'Gestion de Eventos',
    desc: 'Crea eventos puntuales o recurrentes con toda la configuracion que necesitas.',
  },
  {
    icon: QrCode,
    title: 'Control de Acceso QR',
    desc: 'Genera codigos QR unicos por registro y valida la entrada en tiempo real.',
  },
  {
    icon: ClipboardList,
    title: 'Formularios Dinamicos',
    desc: 'Disena formularios personalizados para cada evento con los campos que necesites.',
  },
  {
    icon: CreditCard,
    title: 'Cobro de Entradas',
    desc: 'Integra pasarelas de pago para vender entradas directamente desde la plataforma.',
  },
  {
    icon: ShieldCheck,
    title: 'Registro Seguro',
    desc: 'Cada asistente recibe un QR unico e intransferible vinculado a su registro.',
  },
  {
    icon: BarChart3,
    title: 'Analitica en Tiempo Real',
    desc: 'Visualiza registros, asistencia e ingresos con dashboards detallados.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Navbar */}
      <nav className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            AppBar
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition font-medium"
            >
              Iniciar Sesion
            </Link>
            <Link
              href="/register"
              className="text-sm px-5 py-2.5 bg-white text-[#0f172a] rounded-xl hover:bg-slate-100 transition font-medium"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with decorative background */}
      <section className="relative overflow-hidden pt-16 pb-28">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px]" />

        <div className="absolute top-20 left-[10%] opacity-10">
          <Music className="w-16 h-16 text-white" />
        </div>
        <div className="absolute top-40 right-[12%] opacity-10">
          <Wine className="w-12 h-12 text-white" />
        </div>
        <div className="absolute bottom-20 left-[15%] opacity-10">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div className="absolute bottom-32 right-[18%] opacity-10">
          <QrCode className="w-14 h-14 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-6">
            La mejor noche empieza con la mejor
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent"> organizacion</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Eventos, entradas, control de acceso y carta digital. Todo en una sola plataforma.
          </p>

          <Link
            href="/bars"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#0f172a] rounded-xl text-sm hover:bg-slate-100 transition font-semibold"
          >
            Explorar bares
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="flex items-center justify-center gap-8 mt-14">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-slate-500 mt-0.5">Digital</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">QR</p>
              <p className="text-xs text-slate-500 mt-0.5">Control acceso</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">MP</p>
              <p className="text-xs text-slate-500 mt-0.5">Pagos integrados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white rounded-t-[2.5rem]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3 text-[#0f172a]">
              Todo lo que necesitas
            </h2>
            <p className="text-gray-500 text-lg">
              Herramientas pensadas para la gestion de eventos en tu bar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition group"
              >
                <div className="w-11 h-11 bg-[#0f172a] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#0f172a] text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-slate-400 py-8">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <span className="font-semibold text-white">AppBar</span>
          <p className="text-sm">2026 AppBar. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
