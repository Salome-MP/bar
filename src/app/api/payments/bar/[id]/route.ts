import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult
  const user = authResult

  try {
    const { id } = await params

    const bar = await prisma.bar.findUnique({ where: { id } })
    if (!bar) {
      return Response.json({ detail: 'Bar no encontrado' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    const events = await prisma.event.findMany({
      where: { barId: id },
      select: { id: true },
    })
    const eventIds = events.map((e) => e.id)

    const payments = await prisma.payment.findMany({
      where: {
        registration: { eventId: { in: eventIds } },
      },
      include: {
        registration: {
          include: { event: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(
      payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        state: p.state,
        external_ref: p.externalRef,
        created_at: p.createdAt.toISOString(),
        registration_id: p.registrationId,
        event_title: p.registration.event.title,
      }))
    )
  } catch (error) {
    console.error('Payment history error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
