'use client'

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Download, ArrowLeft, RotateCcw } from 'lucide-react';

export default function PaymentResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const status = params.status as string;
  const registrationId = searchParams.get('registration_id');

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Pago exitoso</h1>
          <p className="text-gray-500 mb-8">
            Tu registro ha sido confirmado. Ya podes descargar tu codigo QR de acceso.
          </p>

          {registrationId && (
            <a
              href={`/api/registrations/${registrationId}/qr`}
              download
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition mb-4"
            >
              <Download className="w-4 h-4" />
              Descargar QR de acceso
            </a>
          )}

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0f172a] font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Pago pendiente</h1>
          <p className="text-gray-500 mb-8">
            Tu pago esta siendo procesado. Te notificaremos cuando se confirme.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0f172a] font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // failure
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Pago fallido</h1>
        <p className="text-gray-500 mb-8">
          Hubo un problema al procesar tu pago. Podes intentar nuevamente.
        </p>

        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-xl text-sm font-medium hover:bg-[#1e293b] transition mb-4"
        >
          <RotateCcw className="w-4 h-4" />
          Intentar nuevamente
        </button>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0f172a] font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
