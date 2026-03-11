import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult

  try {
    const { id } = await params
    const body = await request.json()
    const { qr_token, occurrence_id } = body

    if (!qr_token) {
      return Response.json({ detail: 'Token QR requerido' }, { status: 400 })
    }

    const registration = await prisma.registration.findUnique({
      where: { qrToken: qr_token },
      include: { attendance: true },
    })

    if (!registration) {
      return Response.json({ detail: 'Registro no encontrado' }, { status: 404 })
    }

    if (registration.eventId !== id) {
      return Response.json({ detail: 'El registro no corresponde a este evento' }, { status: 400 })
    }

    if (occurrence_id && registration.occurrenceId && registration.occurrenceId !== occurrence_id) {
      return Response.json({ detail: 'El registro no corresponde a esta fecha' }, { status: 400 })
    }

    if (registration.attendance) {
      return Response.json({ detail: 'Ya se registro la asistencia' }, { status: 400 })
    }

    const attendance = await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        eventId: id,
        occurrenceId: registration.occurrenceId || occurrence_id || null,
        method: 'MANUAL',
      },
    })

    return Response.json({
      message: 'Check-in manual exitoso',
      registration_id: registration.id,
      checked_in_at: attendance.checkedInAt.toISOString(),
    })
  } catch (error) {
    console.error('Manual checkin error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
