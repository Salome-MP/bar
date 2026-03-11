import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult

  try {
    const bars = await prisma.bar.findMany({
      include: {
        admin: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        events: { select: { id: true } },
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = await Promise.all(
      bars.map(async (bar) => {
        const eventIds = bar.events.map((e) => e.id)
        const totalRegistrations = eventIds.length > 0
          ? await prisma.registration.count({ where: { eventId: { in: eventIds } } })
          : 0

        return {
          id: bar.id,
          name: bar.name,
          slug: bar.slug,
          is_active: bar.isActive,
          created_at: bar.createdAt.toISOString(),
          admin: {
            id: bar.admin.id,
            email: bar.admin.email,
            first_name: bar.admin.firstName,
            last_name: bar.admin.lastName,
          },
          total_events: bar._count.events,
          total_registrations: totalRegistrations,
        }
      })
    )

    return Response.json(result)
  } catch (error) {
    console.error('Admin list bars error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
