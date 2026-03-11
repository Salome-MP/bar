'use client'

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setSent(true); // Mostrar exito de todas formas por seguridad
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {sent ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#0f172a] text-white px-8 py-5 rounded-t-2xl">
              <p className="text-lg font-bold">AppBar</p>
            </div>
            <div className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-[#0f172a] mb-2">Correo enviado</h1>
              <p className="text-gray-500 text-sm mb-6">
                Si el email esta registrado, recibiras un enlace para restablecer tu contrasena.
              </p>
              <Link href="/login" className="text-[#0f172a] text-sm font-medium underline-offset-4 hover:underline">
                Volver al login
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#0f172a] text-white px-8 py-5 rounded-t-2xl">
              <p className="text-lg font-bold">AppBar</p>
            </div>
            <div className="p-8">
              <h1 className="text-xl font-bold text-[#0f172a] mb-1">Recuperar contrasena</h1>
              <p className="text-gray-500 text-sm mb-6">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
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
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent bg-white text-[#0f172a] placeholder-gray-400"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0f172a] text-white py-3 rounded-xl hover:bg-[#1e293b] transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  ) : (
                    'Enviar enlace'
                  )}
                </button>
              </form>
              <p className="text-center text-sm mt-5">
                <Link href="/login" className="text-gray-500 hover:text-[#0f172a] inline-flex items-center gap-1 transition">
                  <ArrowLeft className="w-3 h-3" /> Volver al login
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
