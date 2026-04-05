import QRCode from 'qrcode'

// ── Generación de QR ────────────────────────────────────────
export async function generarQRDataURL(token: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/ticket/${token}`
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  })
}

// ── Código de referencia para transferencias ────────────────
export function generarCodigoReferencia(nombre: string): string {
  const base = nombre
    .split(' ')[0]
    .substring(0, 4)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '')
  const num = Math.floor(1000 + Math.random() * 8999)
  return `JMP-${base}-${num}`
}

// ── Slug desde texto ─────────────────────────────────────────
export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ── Formato de moneda ARS ────────────────────────────────────
export function formatearPrecio(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(monto)
}

// ── Formato de fecha ─────────────────────────────────────────
export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ── Mensaje WhatsApp para comprobante de transferencia ───────
export function mensajeWAComprobante(
  nombre: string,
  referencia: string,
  precio: number
): string {
  return encodeURIComponent(
    `Hola! Realicé la transferencia para el evento Jumping Master Class.\n\n` +
    `Nombre: ${nombre}\n` +
    `Código de referencia: ${referencia}\n` +
    `Monto: ${formatearPrecio(precio)}\n\n` +
    `Adjunto el comprobante 👇`
  )
}

// ── Mensaje WhatsApp para enviar link de ticket ───────────────
export function mensajeWATicket(nombre: string, token: string): string {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/ticket/${token}`
  return encodeURIComponent(
    `Hola ${nombre.split(' ')[0]}! ✅ Tu pago fue confirmado.\n\n` +
    `Tu entrada para Jumping Master Class:\n${url}\n\n` +
    `Guardá el link — vas a necesitar el QR para entrar al evento 🎟`
  )
}
