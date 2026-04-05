import { Asistente, Evento } from '@/types'
import { formatearPrecio } from '@/lib/utils'

// ── Config Evolution API ─────────────────────────────────────
const EVOLUTION_URL      = process.env.EVOLUTION_API_URL      // ej: http://tu-oracle-server:8080
const EVOLUTION_API_KEY  = process.env.EVOLUTION_API_KEY
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME // ej: jumping-events

// ── Helpers de formato ───────────────────────────────────────
function limpiarTelefono(tel: string): string {
  // Convierte "11 4567-8901" → "5491145678901"
  const solo = tel.replace(/\D/g, '')
  if (solo.startsWith('54')) return solo
  if (solo.startsWith('0')) return `54${solo.slice(1)}`
  return `549${solo}`
}

// ── Mensaje con link al ticket ────────────────────────────────
export function textoTicketWA(asistente: Asistente, evento: Evento): string {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/ticket/${asistente.qr_token}`
  const nombre = asistente.nombre.split(' ')[0]
  return (
    `Hola ${nombre}! ✅ Tu pago fue confirmado.\n\n` +
    `Tu entrada para *${evento.nombre}*:\n${url}\n\n` +
    `Guardá el link — vas a necesitar el QR para entrar al evento 🎟`
  )
}

// ── Mensaje con datos de transferencia ────────────────────────
export function textoComprobantWA(
  nombre: string,
  referencia: string,
  precio: number,
  alias: string
): string {
  return (
    `Hola! Realicé la transferencia para Jumping Master Class.\n\n` +
    `*Nombre:* ${nombre}\n` +
    `*Referencia:* ${referencia}\n` +
    `*Monto:* ${formatearPrecio(precio)}\n` +
    `*Alias:* ${alias}\n\n` +
    `Adjunto el comprobante 👇`
  )
}

// ── Link wa.me (el organizadora hace click para enviar) ───────
export function linkWATicket(asistente: Asistente, evento: Evento): string {
  const texto = encodeURIComponent(textoTicketWA(asistente, evento))
  const telefono = asistente.telefono ? limpiarTelefono(asistente.telefono) : ''
  return telefono
    ? `https://wa.me/${telefono}?text=${texto}`
    : `https://wa.me/?text=${texto}`
}

// ── Envío automático via Evolution API ───────────────────────
export async function enviarTicketPorWA(
  asistente: Asistente,
  evento: Evento
): Promise<{ ok: boolean; modo: 'automatico' | 'manual'; linkManual?: string }> {
  // Si no hay Evolution API configurada → devuelve link manual
  if (!EVOLUTION_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    return { ok: true, modo: 'manual', linkManual: linkWATicket(asistente, evento) }
  }

  // Si no tiene teléfono → link manual
  if (!asistente.telefono) {
    return { ok: true, modo: 'manual', linkManual: linkWATicket(asistente, evento) }
  }

  try {
    const telefono = limpiarTelefono(asistente.telefono)
    const mensaje  = textoTicketWA(asistente, evento)

    const res = await fetch(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: telefono,
          text: mensaje,
        }),
      }
    )

    if (!res.ok) throw new Error(await res.text())
    return { ok: true, modo: 'automatico' }
  } catch (err) {
    console.error('Evolution API error:', err)
    // Fallback a link manual si falla el envío automático
    return { ok: true, modo: 'manual', linkManual: linkWATicket(asistente, evento) }
  }
}
