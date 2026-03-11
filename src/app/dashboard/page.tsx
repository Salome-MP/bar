'use client'

import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ClipboardList,
  QrCode,
  BarChart3,
  UtensilsCrossed,
  CreditCard,
} from 'lucide-react';

const cards = [
  { label: 'Eventos', path: '/dashboard/events', icon: CalendarDays, desc: 'Crea y gestiona tus eventos' },
  { label: 'Formularios', path: '/dashboard/forms', icon: ClipboardList, desc: 'Diseña formularios de registro' },
  { label: 'Control de Acceso', path: '/dashboard/access', icon: QrCode, desc: 'Escanea QR en la puerta' },
  { label: 'Analiticas', path: '/dashboard/analytics', icon: BarChart3, desc: 'Estadisticas y reportes' },
  { label: 'Carta / Menu', path: '/dashboard/menu', icon: UtensilsCrossed, desc: 'Tu menu digital' },
  { label: 'Pagos', path: '/dashboard/payments', icon: CreditCard, desc: 'Historial de cobros' },
];

export default function DashboardHomePage() {
  const router = useRouter();

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0f172a] mb-6">Panel de control</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="bg-white rounded-2xl p-6 text-left shadow-sm hover:shadow-md hover:border-[#0f172a]/20 border border-gray-100 transition-all group"
          >
            <item.icon className="w-6 h-6 text-[#0f172a] mb-4 group-hover:text-[#1e293b] transition-colors" />
            <p className="font-semibold text-[#0f172a]">{item.label}</p>
            <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
