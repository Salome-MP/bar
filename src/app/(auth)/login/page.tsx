'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contrasena.');
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
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Gestiona tu bar de forma inteligente
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Organiza eventos, controla asistencia y hace crecer tu negocio con herramientas simples y potentes.
          </p>
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

          <h1 className="text-2xl font-bold text-[#0f172a] mb-1">
            Iniciar Sesion
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Ingresa tus credenciales para acceder al panel
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tu contrasena"
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent bg-white text-[#0f172a] placeholder-gray-400"
                />
              </div>
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#0f172a] font-medium underline-offset-4 hover:underline">
                Olvidaste tu contrasena?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f172a] text-white py-3 rounded-xl hover:bg-[#1e293b] transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesion'
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6 text-gray-500">
            No tenes cuenta?{' '}
            <Link href="/register" className="text-[#0f172a] font-medium underline-offset-4 hover:underline">
              Registra tu bar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
