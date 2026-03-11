import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) {
      return Response.json({ detail: 'Evento no encontrado' }, { status: 404 })
    }

    const occurrences = await prisma.eventOccurrence.findMany({
      where: { eventId: id },
      orderBy: { date: 'asc' },
      include: {
        _count: { select: { registrations: true, attendances: true } },
      },
    })

    return Response.json(
      occurrences.map((o) => ({
        id: o.id,
        date: o.date.toISOString(),
        registered_count: o._count.registrations,
        attended_count: o._count.attendances,
      }))
    )
  } catch (error) {
    console.error('List occurrences error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
