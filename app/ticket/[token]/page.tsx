'use client'

import { useState, useEffect } from 'react'
import { ios } from '@/components/ui/ios'
import type { Asistente, Evento, EventoProfesor, Profesor } from '@/types'

interface Props { params: { token: string } }

type TicketData = Asistente & {
  evento: Evento
  evento_profesor?: EventoProfesor & { profesor?: Profesor }
}

export default function TicketPage({ params }: Props) {
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarTicket() }, [])

  async function cargarTicket() {
    const res = await fetch(`/api/ticket/${params.token}`)
    if (res.ok) {
      const data = await res.json()
      setTicket(data.ticket)
      // Generar QR en el cliente
      generarQR(data.ticket.qr_token)
    }
    setCargando(false)
  }

  async function generarQR(token: string) {
    const QRCode = (await import('qrcode')).default
    const url = `${window.location.origin}/ticket/${token}`
    const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 1, color: { dark: '#000', light: '#fff' } })
    setQrUrl(dataUrl)
  }

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: ios.font }}>Cargando ticket…</span>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎟</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'white', fontFamily: ios.font }}>Ticket no encontrado</div>
        </div>
      </div>
    )
  }

  const { evento, evento_profesor } = ticket
  const profe = evento_profesor?.profesor
  const contenidoActivo = evento.contenido_activo

  const estadoBadge = {
    confirmado: { label: 'Acceso confirmado ✓', color: ios.green, bg: ios.green + '33' },
    efectivo:   { label: 'Pago en puerta 💵', color: ios.blue, bg: ios.blue + '33' },
    pendiente:  { label: 'Pago pendiente ⏳', color: ios.orange, bg: ios.orange + '33' },
  }
  const badge = estadoBadge[ticket.estado as keyof typeof estadoBadge] ?? estadoBadge.pendiente

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f,#12071e,#0a0f1a)', fontFamily: ios.font }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ background: 'linear-gradient(135deg,#5856D6,#FF2D55)', padding: '28px 24px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Entrada oficial</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 12 }}>{evento.nombre}</div>
              <span style={{ background: badge.bg, color: badge.color, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                {badge.label}
              </span>
            </div>
          </div>

          {/* Datos asistente */}
          <div style={{ padding: '16px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Asistente</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: 'white' }}>{ticket.nombre}</div>
            {profe && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>con {profe.nombre}</div>}
          </div>

          {/* Datos del evento */}
          <div style={{ padding: '12px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', gap: 20 }}>
            {[
              { l: 'Fecha', v: new Date(evento.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) },
              { l: 'Hora', v: new Date(evento.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs' },
              { l: 'Lugar', v: evento.lugar.split(',')[0] },
            ].map(d => (
              <div key={d.l}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{d.l}</div>
                <div style={{ fontSize: 13, color: 'white', fontWeight: 500 }}>{d.v}</div>
              </div>
            ))}
          </div>

          {/* QR */}
          <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
            <div style={{ background: '#1a1a2e', borderRadius: 14, padding: 16 }}>
              {qrUrl
                ? <img src={qrUrl} alt="QR" style={{ width: 200, height: 200, display: 'block' }} />
                : <div style={{ width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
              }
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em', marginTop: 10, fontFamily: 'monospace' }}>
              {ticket.qr_token.toUpperCase().substring(0, 20)}
            </div>
          </div>

          {/* Contenido post-evento */}
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 14 }}>
              Contenido del evento
            </div>

            {contenidoActivo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { show: !!evento.link_fotos, href: evento.link_fotos!, icono: '📸', label: 'Fotos del evento', sub: 'Ver galería completa', color: '#AF52DE' },
                  { show: !!evento.link_video, href: evento.link_video!, icono: '🎥', label: 'Video del evento', sub: 'Ver grabación completa', color: '#FF2D55' },
                  { show: !!evento.link_tracks, href: evento.link_tracks!, icono: '🎵', label: 'Tracks oficiales', sub: 'Escuchar setlist', color: '#FF9500' },
                ].filter(i => i.show).map(item => (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', border: '0.5px solid rgba(255,255,255,0.07)', textDecoration: 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: item.color + '22' }}>{item.icono}</div>
                    <div>
                      <div style={{ fontSize: 14, color: 'white', fontWeight: 500 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{item.sub}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>→</div>
                  </a>
                ))}

                {/* Redes de profes */}
                {profe && (profe.instagram || profe.tiktok) && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tu profe</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {profe.instagram && (
                        <a href={`https://instagram.com/${profe.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '5px 12px', fontSize: 12, color: '#c084fc', textDecoration: 'none' }}>
                          IG {profe.instagram}
                        </a>
                      )}
                      {profe.tiktok && (
                        <a href={`https://tiktok.com/${profe.tiktok.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '5px 12px', fontSize: 12, color: '#f9a8d4', textDecoration: 'none' }}>
                          TT {profe.tiktok}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 24, textAlign: 'center', border: '0.5px dashed rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  Fotos, videos y tracks<br />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Disponibles después del evento</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
          Jumping Events · Powered by NEXO
        </div>
      </div>
    </div>
  )
}
