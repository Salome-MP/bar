import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MercadoPagoConfig, Payment } from 'mercadopago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type !== 'payment') {
      return Response.json({ status: 'ignored' })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return Response.json({ status: 'no payment id' })
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const paymentApi = new Payment(client)
    const paymentInfo = await paymentApi.get({ id: paymentId })

    if (paymentInfo.status === 'approved') {
      const registrationId = paymentInfo.external_reference

      if (!registrationId) {
        return Response.json({ status: 'no external reference' })
      }

      await prisma.registration.update({
        where: { id: registrationId },
        data: { paymentStatus: 'PAID' },
      })

      await prisma.payment.upsert({
        where: { registrationId },
        create: {
          amount: paymentInfo.transaction_amount || 0,
          state: 'COMPLETED',
          externalRef: String(paymentId),
          registrationId,
        },
        update: {
          amount: paymentInfo.transaction_amount || 0,
          state: 'COMPLETED',
          externalRef: String(paymentId),
        },
      })
    }

    return Response.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return Response.json({ detail: 'Error interno del servidor' }, { status: 500 })
  }
}
