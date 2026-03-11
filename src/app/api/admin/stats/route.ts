import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult

  try {
    const totalBars = await prisma.bar.count()
    const activeBars = await prisma.bar.count({ where: { isActive: true } })
    const totalEvents = await prisma.event.count()
    const totalRegistrations = await prisma.registration.count()

    const payments = await prisma.payment.aggregate({
      where: { state: 'COMPLETED' },
      _sum: { amount: true },
    })

    return Response.json({
      total_bars: totalBars,
      active_bars: activeBars,
      total_events: totalEvents,
      total_registrations: totalRegistrations,
      total_revenue: payments._sum.amount || 0,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
