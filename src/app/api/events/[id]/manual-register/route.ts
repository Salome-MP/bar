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

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) {
      return Response.json({ detail: 'Evento no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { form_data, attendee_name, attendee_email, attendee_phone } = body

    const mergedFormData = {
      ...(form_data || {}),
      ...(attendee_name && { _attendee_name: attendee_name }),
      ...(attendee_email && { _attendee_email: attendee_email }),
      ...(attendee_phone && { _attendee_phone: attendee_phone }),
    }

    const registration = await prisma.registration.create({
      data: {
        eventId: id,
        formData: mergedFormData,
        paymentStatus: 'FREE',
      },
    })

    return Response.json(
      {
        id: registration.id,
        event_id: registration.eventId,
        qr_token: registration.qrToken,
        form_data: registration.formData,
        payment_status: registration.paymentStatus,
        created_at: registration.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Manual register error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
