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
    const { searchParams } = new URL(request.url)
    const occurrenceId = searchParams.get('occurrence_id')

    const event = await prisma.event.findUnique({
      where: { id },
      include: { bar: true },
    })

    if (!event) {
      return Response.json({ detail: 'Evento no encontrado' }, { status: 404 })
    }

    if (user.role === 'BAR_ADMIN' && event.bar.adminId !== user.id) {
      return Response.json({ detail: 'Permiso denegado' }, { status: 403 })
    }

    const regWhere: any = { eventId: id }
    const attWhere: any = { eventId: id }
    if (occurrenceId) {
      regWhere.occurrenceId = occurrenceId
      attWhere.occurrenceId = occurrenceId
    }

    const totalRegistered = await prisma.registration.count({ where: regWhere })
    const totalAttended = await prisma.attendance.count({ where: attWhere })

    const payments = await prisma.payment.aggregate({
      where: {
        registration: regWhere,
        state: 'COMPLETED',
      },
      _sum: { amount: true },
    })

    const attendanceRate = totalRegistered > 0 ? (totalAttended / totalRegistered) * 100 : 0
    const occupancyRate = event.capacity
      ? (totalRegistered / event.capacity) * 100
      : 0

    // Per-occurrence breakdown for recurring events
    let occurrenceStats = null
    if (event.eventType === 'RECURRING' && !occurrenceId) {
      const occurrences = await prisma.eventOccurrence.findMany({
        where: { eventId: id },
        orderBy: { date: 'asc' },
        include: {
          _count: { select: { registrations: true, attendances: true } },
        },
      })
      occurrenceStats = occurrences.map((o) => ({
        id: o.id,
        date: o.date.toISOString(),
        registered: o._count.registrations,
        attended: o._count.attendances,
        attendance_rate: o._count.registrations > 0
          ? Math.round((o._count.attendances / o._count.registrations) * 10000) / 100
          : 0,
      }))
    }

    return Response.json({
      total_registered: totalRegistered,
      total_attended: totalAttended,
      attendance_rate: Math.round(attendanceRate * 100) / 100,
      total_revenue: payments._sum.amount || 0,
      capacity: event.capacity,
      occupancy_rate: Math.round(occupancyRate * 100) / 100,
      occurrence_stats: occurrenceStats,
    })
  } catch (error) {
    console.error('Event analytics error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
