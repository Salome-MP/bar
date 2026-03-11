import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult

  try {
    const { id } = await params

    const orderItem = await prisma.orderItem.findUnique({
      where: { id },
      include: { registration: { include: { event: true } } },
    })

    if (!orderItem) {
      return Response.json({ detail: 'Item no encontrado' }, { status: 404 })
    }

    // Verify the admin owns this bar's event
    if (authResult.role !== 'SUPER_ADMIN') {
      const bar = await prisma.bar.findFirst({ where: { adminId: authResult.id } })
      if (!bar || orderItem.registration.event.barId !== bar.id) {
        return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
      }
    }

    const updated = await prisma.orderItem.update({
      where: { id },
      data: {
        delivered: !orderItem.delivered,
        deliveredAt: orderItem.delivered ? null : new Date(),
      },
    })

    return Response.json({
      id: updated.id,
      delivered: updated.delivered,
      delivered_at: updated.deliveredAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('Deliver order item error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
