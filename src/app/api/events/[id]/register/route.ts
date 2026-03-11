import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendRegistrationEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      include: { bar: true },
    })

    if (!event) {
      return Response.json({ detail: 'Evento no encontrado' }, { status: 404 })
    }

    if (!event.isActive) {
      return Response.json({ detail: 'Evento no activo' }, { status: 400 })
    }

    const body = await request.json()
    const { form_data, attendee_name, attendee_email, attendee_phone, order_items, occurrence_id } = body

    // Resolve occurrence
    let occurrence = null
    if (occurrence_id) {
      occurrence = await prisma.eventOccurrence.findUnique({
        where: { id: occurrence_id },
      })
      if (!occurrence || occurrence.eventId !== id) {
        return Response.json({ detail: 'Fecha no valida para este evento' }, { status: 400 })
      }
    } else {
      // For single events or backward compat, find/use the first occurrence
      occurrence = await prisma.eventOccurrence.findFirst({
        where: { eventId: id },
        orderBy: { date: 'asc' },
      })
    }

    // Check capacity per occurrence
    if (event.capacity) {
      const countFilter = occurrence
        ? { occurrenceId: occurrence.id }
        : { eventId: id }
      const count = await prisma.registration.count({ where: countFilter })
      if (count >= event.capacity) {
        return Response.json({ detail: 'Evento lleno' }, { status: 400 })
      }
    }

    // Validate order items if provided
    let validatedItems: { menuItemId: string; quantity: number; unitPrice: number; notes?: string }[] = []
    if (order_items && Array.isArray(order_items) && order_items.length > 0) {
      const itemIds = order_items.map((i: any) => i.menu_item_id)
      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: itemIds }, available: true },
      })
      const menuItemMap = new Map(menuItems.map((m) => [m.id, m]))

      for (const item of order_items) {
        const menuItem = menuItemMap.get(item.menu_item_id)
        if (!menuItem) {
          return Response.json(
            { detail: `Item del menu no disponible: ${item.menu_item_id}` },
            { status: 400 }
          )
        }
        validatedItems.push({
          menuItemId: menuItem.id,
          quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
          unitPrice: menuItem.price,
          notes: item.notes || null,
        })
      }
    }

    const paymentStatus = 'FREE'

    const mergedFormData = {
      ...(form_data || {}),
      ...(attendee_name && { _attendee_name: attendee_name }),
      ...(attendee_email && { _attendee_email: attendee_email }),
      ...(attendee_phone && { _attendee_phone: attendee_phone }),
    }

    const registration = await prisma.registration.create({
      data: {
        eventId: id,
        occurrenceId: occurrence?.id || null,
        formData: mergedFormData,
        paymentStatus,
        ...(validatedItems.length > 0 && {
          orderItems: {
            create: validatedItems.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              notes: item.notes,
            })),
          },
        }),
      },
      include: { orderItems: { include: { menuItem: true } } },
    })

    // Send email in background (don't block the response)
    if (attendee_email) {
      const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/registrations/${registration.id}/qr`
      sendRegistrationEmail(
        attendee_email,
        attendee_name || 'Asistente',
        event.title,
        (occurrence?.date || event.startDate).toLocaleDateString('es-AR'),
        event.bar.name,
        event.hasAccessControl,
        qrUrl
      ).catch((e) => console.error('Error sending registration email:', e))
    }

    const orderTotal = registration.orderItems.reduce(
      (sum, oi) => sum + oi.unitPrice * oi.quantity, 0
    )

    return Response.json(
      {
        id: registration.id,
        event_id: registration.eventId,
        qr_token: registration.qrToken,
        form_data: registration.formData,
        payment_status: registration.paymentStatus,
        created_at: registration.createdAt.toISOString(),
        order_items: registration.orderItems.map((oi) => ({
          id: oi.id,
          menu_item_name: oi.menuItem.name,
          quantity: oi.quantity,
          unit_price: oi.unitPrice,
          notes: oi.notes,
        })),
        occurrence_id: occurrence?.id || null,
        occurrence_date: occurrence?.date?.toISOString() || null,
        order_total: orderTotal,
        entry_price: event.price || 0,
        total: (event.price || 0) + orderTotal,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
