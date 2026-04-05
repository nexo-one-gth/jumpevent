import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { ResultadoScan } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { qr_token, pin, evento_id } = await req.json()

    if (!qr_token || !pin || !evento_id) {
      return NextResponse.json<ResultadoScan>({ ok: false, mensaje: 'error' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Verificar PIN del evento
    const { data: pinData } = await supabase
      .from('scanner_pins')
      .select('id')
      .eq('evento_id', evento_id)
      .eq('pin', pin)
      .eq('activo', true)
      .single()

    if (!pinData) {
      return NextResponse.json<ResultadoScan>({ ok: false, mensaje: 'error' }, { status: 401 })
    }

    // 2. Buscar asistente por token
    const { data: asistente, error } = await supabase
      .from('asistentes')
      .select(`
        *,
        evento_profesor:evento_profesores(
          slug,
          profesor:profesores(nombre, instagram)
        )
      `)
      .eq('qr_token', qr_token)
      .eq('evento_id', evento_id)
      .single()

    if (error || !asistente) {
      return NextResponse.json<ResultadoScan>({ ok: false, mensaje: 'invalido' })
    }

    // 3. Pago pendiente → no dejar pasar
    if (asistente.estado === 'pendiente') {
      return NextResponse.json<ResultadoScan>({ ok: false, mensaje: 'pago_pendiente' })
    }

    // 4. Ya escaneado → avisar pero no bloquear (decisión de la organizadora)
    if (asistente.asistio) {
      return NextResponse.json<ResultadoScan>({
        ok: true,
        asistente,
        mensaje: 'ya_escaneado',
      })
    }

    // 5. Marcar asistencia
    await supabase
      .from('asistentes')
      .update({ asistio: true, asistio_at: new Date().toISOString() })
      .eq('id', asistente.id)

    return NextResponse.json<ResultadoScan>({
      ok: true,
      asistente: { ...asistente, asistio: true },
      mensaje: 'acceso_ok',
    })
  } catch (error) {
    console.error('Error scanner:', error)
    return NextResponse.json<ResultadoScan>({ ok: false, mensaje: 'error' }, { status: 500 })
  }
}
