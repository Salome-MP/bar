import { NextRequest } from 'next/server'
import { generateQrImage } from '@/lib/qr'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL}/bars/${id}/menu`
    const qrBuffer = await generateQrImage(menuUrl)

    return new Response(new Uint8Array(qrBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Menu QR error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
