import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const occurrenceId = searchParams.get('occurrence_id')

    const where: any = { eventId: id }
    if (occurrenceId) {
      where.occurrenceId = occurrenceId
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        attendance: true,
        orderItems: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(
      registrations.map((r) => {
        const formData = r.formData as Record<string, string> | null
        return {
          id: r.id,
          event_id: r.eventId,
          occurrence_id: r.occurrenceId,
          qr_token: r.qrToken,
          form_data: r.formData,
          payment_status: r.paymentStatus,
          created_at: r.createdAt.toISOString(),
          attendee_name: formData?._attendee_name || null,
          attendee_email: formData?._attendee_email || null,
          attendee_phone: formData?._attendee_phone || null,
          checked_in: !!r.attendance,
          checked_in_at: r.attendance?.checkedInAt?.toISOString() || null,
          order_items: r.orderItems.map((oi) => ({
            id: oi.id,
            name: oi.menuItem.name,
            quantity: oi.quantity,
            unit_price: oi.unitPrice,
            notes: oi.notes,
            delivered: oi.delivered,
            delivered_at: oi.deliveredAt?.toISOString() || null,
          })),
          order_total: r.orderItems.reduce((sum, oi) => sum + oi.unitPrice * oi.quantity, 0),
        }
      })
    )
  } catch (error) {
    console.error('List attendees error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
