import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generarCodigoReferencia } from '@/lib/utils'
import { FormInscripcion } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, ...form }: { slug: string } & FormInscripcion = body

    if (!slug || !form.nombre || !form.email || !form.metodo_pago) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Buscar evento_profesor por slug (dentro del evento activo)
    const { data: ep, error: epError } = await supabase
      .from('evento_profesores')
      .select('*, evento:eventos(*), profesor:profesores(*)')
      .eq('slug', slug)
      .eq('evento.activo', true)
      .single()

    if (epError || !ep) {
      return NextResponse.json({ error: 'Link de inscripción inválido' }, { status: 404 })
    }

    // 2. Generar código de referencia para transferencia
    const codigo_referencia =
      form.metodo_pago === 'Transferencia'
        ? generarCodigoReferencia(form.nombre)
        : undefined

    // 3. Estado inicial según método de pago
    const estado =
      form.metodo_pago === 'Efectivo' ? 'efectivo' : 'pendiente'

    // 4. Insertar asistente
    const { data: asistente, error: insertError } = await supabase
      .from('asistentes')
      .insert({
        evento_id: ep.evento_id,
        evento_profesor_id: ep.id,
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        metodo_pago: form.metodo_pago,
        estado,
        codigo_referencia,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 5. Si es efectivo, verificar automáticamente si el profe quedó gratis
    if (estado === 'efectivo') {
      await supabase.rpc('verificar_entrada_gratis', {
        p_evento_profesor_id: ep.id,
      })
    }

    return NextResponse.json({
      ok: true,
      asistente: {
        nombre: asistente.nombre,
        email: asistente.email,
        estado: asistente.estado,
        codigo_referencia: asistente.codigo_referencia,
        qr_token: asistente.qr_token,
      },
      evento: {
        nombre: ep.evento.nombre,
        precio: ep.evento.precio,
        alias_transferencia: ep.evento.alias_transferencia,
        wa_comprobantes: ep.evento.wa_comprobantes,
      },
    })
  } catch (error: any) {
    console.error('Error inscripcion:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
