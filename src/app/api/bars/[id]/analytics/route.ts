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

    const totalEvents = await prisma.event.count({ where: { barId: id } })
    const activeEvents = await prisma.event.count({
      where: { barId: id, isActive: true, startDate: { gte: new Date() } },
    })

    const events = await prisma.event.findMany({
      where: { barId: id },
      select: { id: true },
    })
    const eventIds = events.map((e) => e.id)

    const totalRegistrations = await prisma.registration.count({
      where: { eventId: { in: eventIds } },
    })

    const totalAttendances = await prisma.attendance.count({
      where: { eventId: { in: eventIds } },
    })

    const payments = await prisma.payment.aggregate({
      where: {
        registration: { eventId: { in: eventIds } },
        state: 'COMPLETED',
      },
      _sum: { amount: true },
    })

    return Response.json({
      total_events: totalEvents,
      active_events: activeEvents,
      total_registrations: totalRegistrations,
      total_attendances: totalAttendances,
      total_revenue: payments._sum.amount || 0,
    })
  } catch (error) {
    console.error('Bar analytics error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
