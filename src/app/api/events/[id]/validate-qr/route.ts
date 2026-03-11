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
      return Response.json({ valid: false, message: 'Token QR requerido' })
    }

    const registration = await prisma.registration.findUnique({
      where: { qrToken: qr_token },
      include: { attendance: true, occurrence: true, orderItems: { include: { menuItem: true } } },
    })

    if (!registration) {
      return Response.json({ valid: false, message: 'Registro no encontrado' })
    }

    if (registration.eventId !== id) {
      return Response.json({ valid: false, message: 'El QR no corresponde a este evento' })
    }

    // For occurrence-based check-in: verify the registration matches the occurrence
    if (occurrence_id && registration.occurrenceId && registration.occurrenceId !== occurrence_id) {
      const occDate = registration.occurrence
        ? new Date(registration.occurrence.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : null
      return Response.json({
        valid: false,
        message: occDate
          ? `Este QR es válido solo para el ${occDate}. Debe registrarse en la fecha de hoy para ingresar.`
          : 'El QR no corresponde a esta fecha del evento',
      })
    }

    if (registration.paymentStatus === 'PENDING') {
      return Response.json({ valid: false, message: 'Pago pendiente' })
    }

    if (registration.attendance) {
      return Response.json({
        valid: false,
        message: 'Ya se registro la asistencia',
        registration_id: registration.id,
      })
    }

    const attendance = await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        eventId: id,
        occurrenceId: registration.occurrenceId || occurrence_id || null,
        method: 'QR',
      },
    })

    const formData = registration.formData as Record<string, string> | null

    return Response.json({
      valid: true,
      message: 'Check-in exitoso',
      registration_id: registration.id,
      attendee_info: {
        name: formData?._attendee_name || null,
        email: formData?._attendee_email || null,
        checked_in_at: attendance.checkedInAt.toISOString(),
      },
      order_items: registration.orderItems.map((oi) => ({
        id: oi.id,
        name: oi.menuItem.name,
        quantity: oi.quantity,
        unit_price: oi.unitPrice,
        delivered: oi.delivered,
      })),
    })
  } catch (error) {
    console.error('Validate QR error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
