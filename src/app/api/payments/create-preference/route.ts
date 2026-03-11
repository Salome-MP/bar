import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registration_id } = body

    if (!registration_id) {
      return Response.json({ detail: 'registration_id requerido' }, { status: 400 })
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registration_id },
      include: {
        event: { include: { bar: true } },
        orderItems: { include: { menuItem: true } },
      },
    })

    if (!registration) {
      return Response.json({ detail: 'Registro no encontrado' }, { status: 404 })
    }

    if (registration.paymentStatus !== 'PENDING') {
      return Response.json({ detail: 'El pago no esta pendiente' }, { status: 400 })
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const preference = new Preference(client)

    const formData = registration.formData as Record<string, string> | null
    const attendeeName = formData?._attendee_name || 'Asistente'

    // Build items array: entry + order items
    const items: { id: string; title: string; description: string; quantity: number; unit_price: number; currency_id: string }[] = []

    if (registration.event.price && registration.event.price > 0) {
      items.push({
        id: `entry-${registration.id}`,
        title: `Entrada - ${registration.event.title}`,
        description: `Registro de ${attendeeName}`,
        quantity: 1,
        unit_price: registration.event.price,
        currency_id: 'ARS',
      })
    }

    for (const oi of registration.orderItems) {
      items.push({
        id: `item-${oi.id}`,
        title: oi.menuItem.name,
        description: oi.menuItem.description || oi.menuItem.name,
        quantity: oi.quantity,
        unit_price: oi.unitPrice,
        currency_id: 'ARS',
      })
    }

    if (items.length === 0) {
      return Response.json({ detail: 'No hay nada que cobrar' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1')

    const backUrls = {
      success: `${appUrl}/payment/success?registration_id=${registration.id}`,
      failure: `${appUrl}/payment/failure?registration_id=${registration.id}`,
      pending: `${appUrl}/payment/pending?registration_id=${registration.id}`,
    }

    const result = await preference.create({
      body: {
        items,
        back_urls: backUrls,
        // auto_return solo funciona con URLs publicas, no localhost
        ...(isLocalhost ? {} : { auto_return: 'approved' as const }),
        external_reference: registration.id,
        // webhook solo funciona con URL publica
        ...(isLocalhost ? {} : { notification_url: `${appUrl}/api/payments/webhook` }),
      },
    })

    return Response.json({
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    })
  } catch (error) {
    console.error('Create preference error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
