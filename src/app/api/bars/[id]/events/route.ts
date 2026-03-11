import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { generateOccurrenceDates } from '@/lib/occurrences'

export async function POST(
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

    const body = await request.json()
    const {
      title, description, image, start_date, end_date, event_type,
      recurrence_rule, access_type, has_access_control,
      form_id, price, capacity,
    } = body

    if (!title || !start_date || !access_type) {
      return Response.json({ detail: 'Faltan campos requeridos' }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        image: image || null,
        startDate: new Date(start_date),
        endDate: end_date ? new Date(end_date) : null,
        eventType: event_type || 'SINGLE',
        recurrenceRule: recurrence_rule || null,
        accessType: access_type,
        hasAccessControl: has_access_control || false,
        formId: form_id || null,
        price: price || null,
        capacity: capacity || null,
        barId: id,
      },
    })

    // Generate occurrences
    const dates = generateOccurrenceDates(
      event.startDate,
      event.eventType,
      event.recurrenceRule as any
    )
    if (dates.length > 0) {
      await prisma.eventOccurrence.createMany({
        data: dates.map((d) => ({ eventId: event.id, date: d })),
        skipDuplicates: true,
      })
    }

    const occurrences = await prisma.eventOccurrence.findMany({
      where: { eventId: event.id },
      orderBy: { date: 'asc' },
    })

    return Response.json(
      {
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
        occurrences: occurrences.map((o) => ({
          id: o.id,
          date: o.date.toISOString(),
        })),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create event error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const events = await prisma.event.findMany({
      where: { barId: id },
      include: {
        registrations: true,
        occurrences: { orderBy: { date: 'asc' } },
      },
      orderBy: { startDate: 'desc' },
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
        registered_count: e.registrations.length,
        occurrences: e.occurrences.map((o) => ({
          id: o.id,
          date: o.date.toISOString(),
        })),
      }))
    )
  } catch (error) {
    console.error('List events error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
