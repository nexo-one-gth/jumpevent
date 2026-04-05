import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generarQRDataURL } from '@/lib/utils'
import { enviarTicketPorEmail } from '@/lib/email'
import { enviarTicketPorWA, linkWATicket } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const { asistente_id, enviar_wa = true } = await req.json()

    if (!asistente_id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Obtener asistente completo con evento
    const { data: asistente, error: fetchError } = await supabase
      .from('asistentes')
      .select('*, evento:eventos(*)')
      .eq('id', asistente_id)
      .single()

    if (fetchError || !asistente) {
      return NextResponse.json({ error: 'Asistente no encontrado' }, { status: 404 })
    }

    if (asistente.estado === 'confirmado') {
      return NextResponse.json({
        ok: true,
        mensaje: 'Ya estaba confirmado',
        wa_link: linkWATicket(asistente, asistente.evento),
      })
    }

    // 2. Confirmar pago en la base de datos
    await supabase
      .from('asistentes')
      .update({
        estado: 'confirmado',
        confirmado_at: new Date().toISOString(),
      })
      .eq('id', asistente_id)

    // 3. Verificar si el profe ahora tiene entrada gratis
    if (asistente.evento_profesor_id) {
      await supabase.rpc('verificar_entrada_gratis', {
        p_evento_profesor_id: asistente.evento_profesor_id,
      })
    }

    const asistenteConfirmado = { ...asistente, estado: 'confirmado' as const }
    const evento = asistente.evento

    // 4. Generar QR (compartido entre email y WA)
    const qrDataURL = await generarQRDataURL(asistente.qr_token)

    // 5. Email (siempre, no interrumpe el flujo si falla)
    let emailOk = false
    try {
      await enviarTicketPorEmail({ asistente: asistenteConfirmado, evento, qrDataURL })
      emailOk = true
    } catch (err) {
      console.error('Error email:', err)
    }

    // 6. WhatsApp: automático via Evolution API si está configurado,
    //    manual via link wa.me si no.
    let waResultado = await enviarTicketPorWA(asistenteConfirmado, evento)

    return NextResponse.json({
      ok: true,
      mensaje: 'Pago confirmado',
      envios: {
        email: {
          ok: emailOk,
          destino: asistente.email,
        },
        whatsapp: {
          ok: waResultado.ok,
          // 'automatico' = Evolution API lo mandó solo
          // 'manual'     = el panel muestra el botón para que la organizadora lo mande
          modo: waResultado.modo,
          link_manual: waResultado.linkManual ?? null,
          telefono: asistente.telefono ?? null,
        },
      },
    })
  } catch (error: any) {
    console.error('Error confirmando pago:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
