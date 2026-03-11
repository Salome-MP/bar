import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        startDate: { gte: new Date() },
      },
      include: { bar: true },
      orderBy: { startDate: 'asc' },
      take: 50,
    })

    return Response.json(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        image: e.image,
        start_date: e.startDate.toISOString(),
        end_date: e.endDate?.toISOString() || null,
        event_type: e.eventType,
        recurrence_rule: e.recurrenceRule,
        access_type: e.accessType,
        has_access_control: e.hasAccessControl,
        form_id: e.formId,
        price: e.price,
        capacity: e.capacity,
        is_active: e.isActive,
        bar_id: e.barId,
        bar_name: e.bar.name,
      }))
    )
  } catch (error) {
    console.error('List public events error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
