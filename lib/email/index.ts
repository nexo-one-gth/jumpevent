import { Resend } from 'resend'
import { Asistente, Evento } from '@/types'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

interface EnviarTicketParams {
  asistente: Asistente
  evento: Evento
  qrDataURL: string
}

export async function enviarTicketPorEmail({
  asistente,
  evento,
  qrDataURL,
}: EnviarTicketParams) {
  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/ticket/${asistente.qr_token}`
  const qrBase64 = qrDataURL.replace('data:image/png;base64,', '')

  const { data, error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: asistente.email,
    subject: `🎟 Tu entrada para ${evento.nombre}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tu entrada</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;background:#f2f2f7;margin:0;padding:24px;">
        <div style="max-width:480px;margin:0 auto;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#5856D6,#FF2D55);border-radius:16px 16px 0 0;padding:28px 24px;">
            <p style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 6px;">Entrada confirmada</p>
            <h1 style="color:white;font-size:26px;font-weight:700;margin:0;letter-spacing:-0.3px;">${evento.nombre}</h1>
            <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:8px 0 0;">
              ${new Date(evento.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · ${new Date(evento.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
            </p>
          </div>

          <!-- Body -->
          <div style="background:white;padding:24px;border-radius:0 0 16px 16px;border:0.5px solid #e5e5ea;border-top:none;">
            <p style="font-size:13px;color:#6d6d72;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 4px;">Asistente</p>
            <p style="font-size:18px;font-weight:600;color:#000;margin:0 0 20px;">${asistente.nombre}</p>

            <!-- QR -->
            <div style="text-align:center;padding:20px;background:#f2f2f7;border-radius:12px;margin-bottom:20px;">
              <img src="cid:qr-code" alt="QR de acceso" style="width:180px;height:180px;display:block;margin:0 auto 10px;" />
              <p style="font-size:12px;color:#8e8e93;font-family:monospace;margin:0;">${asistente.qr_token}</p>
            </div>

            <p style="font-size:14px;color:#3c3c43;line-height:1.6;margin:0 0 16px;">
              Presentá este QR en la entrada del evento. También podés acceder a tu ticket desde el siguiente link:
            </p>

            <a href="${ticketUrl}" style="display:block;background:#007AFF;color:white;text-align:center;padding:14px;border-radius:12px;font-size:16px;font-weight:600;text-decoration:none;">
              Ver mi entrada
            </a>

            <div style="margin-top:20px;padding-top:20px;border-top:0.5px solid #e5e5ea;">
              <p style="font-size:13px;color:#8e8e93;margin:0;">📍 ${evento.lugar}</p>
            </div>
          </div>

          <p style="text-align:center;font-size:12px;color:#8e8e93;margin-top:16px;">
            Jumping Events · Powered by NEXO
          </p>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: 'qr-entrada.png',
        content: qrBase64,
        content_id: 'qr-code',
      },
    ] as any,
  })

  if (error) throw new Error(`Error enviando email: ${error.message}`)
  return data
}
