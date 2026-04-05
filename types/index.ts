// ── Tipos base del dominio ──────────────────────────────────

export type MetodoPago = 'MercadoPago' | 'Transferencia' | 'Efectivo'
export type EstadoPago = 'pendiente' | 'confirmado' | 'efectivo'
export type EstadoTicketProfe = 'pendiente' | 'confirmado' | 'gratis'

// ── Evento ──────────────────────────────────────────────────
export interface Evento {
  id: string
  nombre: string
  fecha: string
  lugar: string
  descripcion?: string
  precio: number
  alias_transferencia: string
  cvu?: string
  wa_comprobantes?: string
  flyer_url?: string
  min_alumnos_gratis: number
  contenido_activo: boolean
  link_fotos?: string
  link_video?: string
  link_tracks?: string
  activo: boolean
  created_at: string
  updated_at: string
}

// ── Profesor ────────────────────────────────────────────────
export interface Profesor {
  id: string
  nombre: string
  instagram?: string
  tiktok?: string
  telefono?: string
  created_at: string
}

// ── Asignación evento ↔ profe ────────────────────────────────
export interface EventoProfesor {
  id: string
  evento_id: string
  profesor_id: string
  slug: string
  ticket_estado: EstadoTicketProfe
  ticket_token: string
  created_at: string
  // Joins
  profesor?: Profesor
  evento?: Evento
  total_alumnos?: number
  alumnos_confirmados?: number
}

// ── Asistente ────────────────────────────────────────────────
export interface Asistente {
  id: string
  evento_id: string
  evento_profesor_id?: string
  nombre: string
  email: string
  telefono?: string
  metodo_pago: MetodoPago
  estado: EstadoPago
  codigo_referencia?: string
  confirmado_at?: string
  qr_token: string
  asistio: boolean
  asistio_at?: string
  created_at: string
  // Joins
  evento_profesor?: EventoProfesor
}

// ── Scanner ──────────────────────────────────────────────────
export interface ScannerPin {
  id: string
  evento_id: string
  pin: string
  activo: boolean
  created_at: string
}

// ── Resultado de escaneo ────────────────────────────────────
export type ResultadoScan =
  | { ok: true;  asistente: Asistente; mensaje: 'acceso_ok' | 'ya_escaneado' }
  | { ok: false; mensaje: 'invalido' | 'pago_pendiente' | 'error' }

// ── Formulario de inscripción (público) ─────────────────────
export interface FormInscripcion {
  nombre: string
  email: string
  telefono?: string
  metodo_pago: MetodoPago
}

// ── Stats del dashboard ──────────────────────────────────────
export interface StatsEvento {
  total_asistentes: number
  confirmados: number
  pendientes: number
  efectivo: number
  asistieron: number
  profes_gratis: number
  profes_pagan: number
  recaudado: number
}
