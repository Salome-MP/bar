import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQrImage } from '@/lib/qr'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const registration = await prisma.registration.findUnique({ where: { id } })
    if (!registration) {
      return Response.json({ detail: 'Registro no encontrado' }, { status: 404 })
    }

    const qrBuffer = await generateQrImage(registration.qrToken)

    return new Response(new Uint8Array(qrBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('QR image error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
