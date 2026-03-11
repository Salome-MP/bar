'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import {
  Store,
  User,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    bar_name: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.push('/dashboard');
    } catch {
      setError('Error al registrar. Verifica los datos e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] text-white flex-col justify-between p-12">
        <div>
          <Link href="/" className="text-2xl font-bold">
            AppBar
          </Link>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight mb-6">
            Registra tu bar en minutos
          </h2>
          <p className="text-white/60 text-lg leading-relaxed mb-10">
            Crea tu cuenta y empeza a gestionar eventos, formularios y asistentes desde un solo lugar.
          </p>

          {/* Step indicators */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                step >= 1 ? 'bg-white text-[#0f172a] border-white' : 'border-white/30 text-white/30'
              }`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <div>
                <p className={`font-medium ${step >= 1 ? 'text-white' : 'text-white/30'}`}>Datos del bar</p>
                <p className={`text-sm ${step >= 1 ? 'text-white/60' : 'text-white/20'}`}>Nombre de tu establecimiento</p>
              </div>
            </div>
            <div className="ml-5 h-6 border-l-2 border-white/20" />
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                step >= 2 ? 'bg-white text-[#0f172a] border-white' : 'border-white/30 text-white/30'
              }`}>
                2
              </div>
              <div>
                <p className={`font-medium ${step >= 2 ? 'text-white' : 'text-white/30'}`}>Datos del administrador</p>
                <p className={`text-sm ${step >= 2 ? 'text-white/60' : 'text-white/20'}`}>Tu informacion personal</p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-white/40 text-sm">
          &copy; {new Date().getFullYear()} AppBar. Todos los derechos reservados.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="text-xl font-bold text-[#0f172a]">
              AppBar
            </Link>
          </div>

          {/* Step indicator - mobile only */}
          <div className="flex items-center justify-center gap-0 mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-[#0f172a] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-[#0f172a]' : 'text-gray-500'}`}>
                Bar
              </span>
            </div>
            <div className="w-12 h-px bg-gray-200 mx-3" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-[#0f172a] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-[#0f172a]' : 'text-gray-500'}`}>
                Admin
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#0f172a] mb-1">
            {step === 1 ? 'Datos del establecimiento' : 'Datos del administrador'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {step === 1
              ? 'Ingresa el nombre de tu bar o restaurante'
              : 'Completa tu informacion para crear la cuenta'}
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre del Bar / Restaurante
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="bar_name"
                    value={form.bar_name}
                    onChange={handleChange}
                    required
                    placeholder="Ej: La Terraza Bar"
                    autoComplete="off"
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent bg-white text-[#0f172a] placeholder-gray-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#0f172a] text-white py-3 rounded-xl hover:bg-[#1e293b] transition font-medium text-sm flex items-center justify-center gap-2"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      required
                      placeholder="Juan"
                      autoComplete="off"
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent bg-white text-[#0f172a] placeholder-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Apellido
                  </label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    placeholder="Perez"
                    autoComplete="off"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent bg-white text-[#0f172a] placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electronico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                    autoComplete="off"
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent bg-white text-[#0f172a] placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contrasena
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Minimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent bg-white text-[#0f172a] placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefono (opcional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+54 11 1234-5678"
                    autoComplete="off"
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent bg-white text-[#0f172a] placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-sm text-[#0f172a] font-medium hover:bg-gray-50 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atras
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#0f172a] text-white py-3 rounded-xl hover:bg-[#1e293b] transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Crear cuenta'
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm mt-6 text-gray-500">
            Ya tenes cuenta?{' '}
            <Link href="/login" className="text-[#0f172a] font-medium underline-offset-4 hover:underline">
              Iniciar sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
