import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    })
  }
  return transporter
}

export async function sendEmail(to: string, subject: string, html: string) {
  const transport = getTransporter()
  if (!transport) {
    console.log(`[EMAIL SKIP] No SMTP configured. Would send to ${to}: ${subject}`)
    return
  }
  const from = process.env.EMAIL_FROM || 'AppBar <noreply@appbar.com>'
  await transport.sendMail({ from, to, subject, html })
}

export async function sendRegistrationEmail(
  to: string,
  attendeeName: string,
  eventTitle: string,
  eventDate: string,
  barName: string,
  hasQr: boolean,
  qrUrl?: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">Registro confirmado</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hola <strong>${attendeeName}</strong>,</p>
        <p>Tu registro al evento <strong>${eventTitle}</strong> fue confirmado.</p>
        <table style="width: 100%; margin: 16px 0; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #64748b;">Evento</td><td style="padding: 8px 0; font-weight: bold;">${eventTitle}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Fecha</td><td style="padding: 8px 0;">${eventDate}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Lugar</td><td style="padding: 8px 0;">${barName}</td></tr>
        </table>
        ${hasQr && qrUrl ? `<p style="text-align: center; margin: 20px 0;"><strong>Tu codigo QR de acceso:</strong></p><p style="text-align: center;"><img src="${qrUrl}" width="200" height="200" alt="QR de acceso" /></p><p style="text-align: center; font-size: 12px; color: #64748b;">Presenta este codigo en la entrada del evento.</p>` : '<p>Este evento no requiere codigo QR. Solo acercate el dia del evento.</p>'}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Enviado por ${barName} a traves de AppBar</p>
      </div>
    </div>
  `
  await sendEmail(to, `Registro confirmado - ${eventTitle}`, html)
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">Recuperar contrasena</h1>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Recibimos una solicitud para restablecer tu contrasena.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Restablecer contrasena</a>
        </p>
        <p style="font-size: 13px; color: #64748b;">Este enlace expira en 30 minutos. Si no solicitaste esto, ignora este correo.</p>
      </div>
    </div>
  `
  await sendEmail(to, 'Recuperar contrasena - AppBar', html)
}
