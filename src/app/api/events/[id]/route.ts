import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { generateOccurrenceDates } from '@/lib/occurrences'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        bar: true,
        registrations: true,
        occurrences: {
          orderBy: { date: 'asc' },
          include: { _count: { select: { registrations: true } } },
        },
      },
    })

    if (!event) {
      return Response.json({ detail: 'Evento no encontrado' }, { status: 404 })
    }

    return Response.json({
      id: event.id,
      title: event.title,
      description: event.description,
      image: event.image,
      start_date: event.startDate.toISOString(),
      end_date: event.endDate?.toISOString() || null,
      event_type: event.eventType,
      recurrence_rule: event.recurrenceRule,
      access_type: event.accessType,
      has_access_control: event.hasAccessControl,
      form_id: event.formId,
      price: event.price,
      capacity: event.capacity,
      is_active: event.isActive,
      bar_id: event.barId,
      bar_name: event.bar.name,
      registered_count: event.registrations.length,
      occurrences: event.occurrences.map((o) => ({
        id: o.id,
        date: o.date.toISOString(),
        registered_count: o._count.registrations,
      })),
    })
  } catch (error) {
    console.error('Get event error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult
  const user = authResult

  try {
    const { id } = await params

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

    const body = await request.json()
    const {
      title, description, start_date, end_date, event_type,
      recurrence_rule, access_type, has_access_control,
      form_id, price, capacity, is_active, image,
    } = body

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(start_date !== undefined && { startDate: new Date(start_date) }),
        ...(end_date !== undefined && { endDate: end_date ? new Date(end_date) : null }),
        ...(event_type !== undefined && { eventType: event_type }),
        ...(recurrence_rule !== undefined && { recurrenceRule: recurrence_rule }),
        ...(access_type !== undefined && { accessType: access_type }),
        ...(has_access_control !== undefined && { hasAccessControl: has_access_control }),
        ...(form_id !== undefined && { formId: form_id || null }),
        ...(price !== undefined && { price }),
        ...(capacity !== undefined && { capacity }),
        ...(is_active !== undefined && { isActive: is_active }),
      },
    })

    // Regenerate occurrences if recurrence config changed
    if (event_type !== undefined || recurrence_rule !== undefined || start_date !== undefined) {
      // Delete future occurrences that have no registrations
      const now = new Date()
      await prisma.eventOccurrence.deleteMany({
        where: {
          eventId: id,
          date: { gte: now },
          registrations: { none: {} },
        },
      })

      // Generate new dates and create missing occurrences
      const dates = generateOccurrenceDates(
        updated.startDate,
        updated.eventType,
        updated.recurrenceRule as any
      )
      if (dates.length > 0) {
        await prisma.eventOccurrence.createMany({
          data: dates.map((d) => ({ eventId: id, date: d })),
          skipDuplicates: true,
        })
      }
    }

    const occurrences = await prisma.eventOccurrence.findMany({
      where: { eventId: id },
      orderBy: { date: 'asc' },
      include: { _count: { select: { registrations: true } } },
    })

    return Response.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      image: updated.image,
      start_date: updated.startDate.toISOString(),
      end_date: updated.endDate?.toISOString() || null,
      event_type: updated.eventType,
      recurrence_rule: updated.recurrenceRule,
      access_type: updated.accessType,
      has_access_control: updated.hasAccessControl,
      form_id: updated.formId,
      price: updated.price,
      capacity: updated.capacity,
      is_active: updated.isActive,
      bar_id: updated.barId,
      occurrences: occurrences.map((o) => ({
        id: o.id,
        date: o.date.toISOString(),
        registered_count: o._count.registrations,
      })),
    })
  } catch (error) {
    console.error('Update event error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, 'BAR_ADMIN', 'SUPER_ADMIN')
  if (authResult instanceof Response) return authResult
  const user = authResult

  try {
    const { id } = await params

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

    await prisma.event.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Delete event error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
