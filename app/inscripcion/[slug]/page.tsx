'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ios } from '@/components/ui/ios'
import { formatearPrecio, mensajeWAComprobante, generarCodigoReferencia } from '@/lib/utils'
import type { EventoProfesor, Evento, Profesor } from '@/types'

type Paso = 'form' | 'exito'

export default function InscripcionPage() {
  const params = useParams<{ slug: string }>()
  const [ep, setEp] = useState<(EventoProfesor & { profesor: Profesor; evento: Evento }) | null>(null)
  const [cargando, setCargando] = useState(true)
  const [paso, setPaso] = useState<Paso>('form')
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', metodo: '' })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [respuesta, setRespuesta] = useState<any>(null)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const res = await fetch(`/api/inscripcion/info?slug=${params.slug}`)
    if (res.ok) {
      const data = await res.json()
      setEp(data.ep)
    }
    setCargando(false)
  }

  function validar() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!form.email.includes('@')) e.email = 'Email inválido'
    if (!form.metodo) e.metodo = 'Elegí un método de pago'
    return e
  }

  async function inscribirse() {
    const e = validar()
    setErrores(e)
    if (Object.keys(e).length) return

    setEnviando(true)
    try {
      const res = await fetch('/api/inscripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, ...form, metodo_pago: form.metodo }),
      })
      const data = await res.json()
      if (data.ok) {
        setRespuesta(data)
        setPaso('exito')
      } else {
        setErrores({ general: data.error ?? 'Error al inscribirse' })
      }
    } catch {
      setErrores({ general: 'Error de conexión' })
    } finally {
      setEnviando(false)
    }
  }

  const METODOS = [
    { id: 'MercadoPago', label: 'MercadoPago', desc: 'Pago online instantáneo', icono: '💳' },
    { id: 'Transferencia', label: 'Transferencia', desc: `Alias: ${ep?.evento?.alias_transferencia ?? ''}`, icono: '🏦' },
    { id: 'Efectivo', label: 'Efectivo', desc: 'Se abona el día del evento', icono: '💵' },
  ]

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: ios.font }}>Cargando…</span>
      </div>
    )
  }

  if (!ep) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'white', fontFamily: ios.font }}>Link inválido</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontFamily: ios.font }}>Este link de inscripción no existe</div>
        </div>
      </div>
    )
  }

  const { evento, profesor } = ep

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0a0f,#12071e,#0a0f1a)', fontFamily: ios.font }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Card del evento */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 16 }}>
          {evento.flyer_url
            ? <img src={evento.flyer_url} alt="flyer" style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }} />
            : (
              <div style={{ background: 'linear-gradient(135deg,#5856D6,#FF2D55)', padding: '24px 20px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Inscripción al evento</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'white', marginTop: 4 }}>{evento.nombre}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
                  {new Date(evento.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {evento.lugar}
                </div>
              </div>
            )
          }
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#AF52DE33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#AF52DE' }}>
              {profesor.nombre.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tu profe</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>{profesor.nombre}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
              {profesor.instagram && <span style={{ fontSize: 11, color: '#c084fc', background: 'rgba(124,58,237,0.2)', borderRadius: 999, padding: '2px 8px' }}>IG</span>}
              {profesor.tiktok && <span style={{ fontSize: 11, color: '#f9a8d4', background: 'rgba(219,39,119,0.2)', borderRadius: 999, padding: '2px 8px' }}>TT</span>}
            </div>
          </div>
        </div>

        {paso === 'form' ? (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.1)', padding: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 20 }}>Tus datos</div>

            {/* Campos */}
            {[
              { key: 'nombre', label: 'Nombre completo', ph: 'Como aparecerá en tu entrada', type: 'text', req: true },
              { key: 'email', label: 'Email', ph: 'Te llega el ticket acá', type: 'email', req: true },
              { key: 'telefono', label: 'WhatsApp (opcional)', ph: 'Para avisarte si hay cambios', type: 'tel' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>
                  {f.label} {f.req && <span style={{ color: ios.pink }}>*</span>}
                </div>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => { setForm(v => ({ ...v, [f.key]: e.target.value })); setErrores(v => ({ ...v, [f.key]: '' })) }}
                  placeholder={f.ph}
                  type={f.type}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.07)',
                    border: `1.5px solid ${errores[f.key] ? ios.red : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, padding: '12px 14px', fontSize: 16,
                    color: 'white', fontFamily: ios.font, outline: 'none',
                  }}
                />
                {errores[f.key] && <div style={{ fontSize: 12, color: ios.red, marginTop: 3 }}>{errores[f.key]}</div>}
              </div>
            ))}

            {/* Métodos de pago */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>
                Método de pago <span style={{ color: ios.pink }}>*</span>
              </div>
              {METODOS.map(m => (
                <div
                  key={m.id}
                  onClick={() => { setForm(v => ({ ...v, metodo: m.id })); setErrores(v => ({ ...v, metodo: '' })) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
                    background: form.metodo === m.id ? 'rgba(0,122,255,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${form.metodo === m.id ? ios.blue : errores.metodo ? ios.red : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{m.icono}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{m.desc}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${form.metodo === m.id ? ios.blue : 'rgba(255,255,255,0.2)'}`, background: form.metodo === m.id ? ios.blue : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white' }}>
                    {form.metodo === m.id && '✓'}
                  </div>
                </div>
              ))}
              {errores.metodo && <div style={{ fontSize: 12, color: ios.red }}>{errores.metodo}</div>}
            </div>

            {/* Info transferencia */}
            {form.metodo === 'Transferencia' && (
              <div style={{ background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.25)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: ios.blue, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Datos para transferir</div>
                {[
                  { l: 'Alias', v: evento.alias_transferencia, mono: true },
                  { l: 'Monto exacto', v: formatearPrecio(evento.precio) },
                  { l: 'Referencia', v: form.nombre ? generarCodigoReferencia(form.nombre) : 'Se genera al inscribirte', mono: true },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{r.l}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'white', fontFamily: r.mono ? 'monospace' : ios.font }}>{r.v}</span>
                  </div>
                ))}
              </div>
            )}

            {errores.general && <div style={{ fontSize: 14, color: ios.red, marginBottom: 12, textAlign: 'center' }}>{errores.general}</div>}

            <button
              onClick={inscribirse}
              disabled={enviando}
              style={{ width: '100%', background: ios.blue, color: 'white', border: 'none', borderRadius: 14, padding: 15, fontSize: 17, fontWeight: 600, fontFamily: ios.font, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? 0.7 : 1 }}
            >
              {enviando ? 'Inscribiendo...' : 'Inscribirme →'}
            </button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 10 }}>
              Tu entrada se genera al confirmar el pago
            </div>
          </div>
        ) : (
          /* Pantalla éxito */
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 24, border: '0.5px solid rgba(255,255,255,0.1)', padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: ios.green + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 18px' }}>🎉</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>¡Ya estás inscripta!</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 24 }}>
              {form.metodo === 'Efectivo'
                ? 'Tu entrada se activa en la puerta. ¡Nos vemos en el evento!'
                : form.metodo === 'Transferencia'
                  ? `Transferí ${formatearPrecio(evento.precio)} al alias ${evento.alias_transferencia} e incluí el código de referencia en el concepto.`
                  : `Realizá el pago por MercadoPago. Al confirmarse te enviamos el QR a ${form.email}.`}
            </div>

            {form.metodo === 'Transferencia' && respuesta?.evento && (
              <a
                href={`https://wa.me/${evento.wa_comprobantes}?text=${mensajeWAComprobante(form.nombre, respuesta.asistente?.codigo_referencia ?? '', evento.precio, evento.alias_transferencia)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: 14, padding: 14, fontSize: 16, fontWeight: 600, fontFamily: ios.font, marginBottom: 12 }}
              >
                💬 Enviar comprobante por WhatsApp
              </a>
            )}

            <button onClick={() => { setPaso('form'); setForm({ nombre: '', email: '', telefono: '', metodo: '' }) }}
              style={{ width: '100%', background: 'none', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: 12, fontSize: 15, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: ios.font }}>
              Inscribir otra persona
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
