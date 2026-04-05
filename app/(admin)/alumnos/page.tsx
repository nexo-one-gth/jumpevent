'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ios, NavBar, SegmentedControl, Avatar, Pill } from '@/components/ui/ios'
import type { Asistente, EventoProfesor, Profesor } from '@/types'

const COLORES = ['#AF52DE', '#FF2D55', '#FF9500', '#007AFF', '#34C759', '#5856D6']

type AsistenteConProfe = Asistente & { evento_profesor?: EventoProfesor & { profesor?: Profesor } }

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState<AsistenteConProfe[]>([])
  const [filtro, setFiltro] = useState('todos')
  const [buscar, setBuscar] = useState('')
  const [cargando, setCargando] = useState(true)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [waLinks, setWaLinks] = useState<Record<string, string>>({})

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const supabase = createClient()
    const { data: ev } = await supabase.from('eventos').select('id').eq('activo', true).single()
    if (!ev) { setCargando(false); return }

    const { data } = await supabase
      .from('asistentes')
      .select(`*, evento_profesor:evento_profesores(*, profesor:profesores(*))`)
      .eq('evento_id', ev.id)
      .order('created_at', { ascending: false })

    setAlumnos((data ?? []) as AsistenteConProfe[])
    setCargando(false)
  }

  async function confirmarPago(alumno: AsistenteConProfe) {
    setConfirmando(alumno.id)
    try {
      const res = await fetch('/api/tickets/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistente_id: alumno.id }),
      })
      const data = await res.json()

      if (data.ok && data.envios?.whatsapp?.link_manual) {
        setWaLinks(prev => ({ ...prev, [alumno.id]: data.envios.whatsapp.link_manual }))
      }

      // Actualizar lista local
      setAlumnos(prev => prev.map(a => a.id === alumno.id ? { ...a, estado: 'confirmado' } : a))
    } catch (err) {
      console.error(err)
    } finally {
      setConfirmando(null)
    }
  }

  const estadoMap: Record<string, { label: string; color: string; bg: string }> = {
    confirmado: { label: 'Confirmado', color: ios.green, bg: ios.green + '1A' },
    pendiente:  { label: 'Pendiente',  color: ios.orange, bg: ios.orange + '1A' },
    efectivo:   { label: 'Efectivo',   color: ios.blue, bg: ios.blue + '1A' },
  }

  const filtrados = alumnos.filter(a => {
    const matchFiltro = filtro === 'todos' || a.estado === filtro
    const matchBuscar = buscar === '' ||
      a.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
      (a.evento_profesor?.profesor?.nombre ?? '').toLowerCase().includes(buscar.toLowerCase())
    return matchFiltro && matchBuscar
  })

  // Agrupar por profe
  const grupos: Record<string, { profe: Profesor | undefined; color: string; alumnos: AsistenteConProfe[] }> = {}
  filtrados.forEach((a, i) => {
    const pid = a.evento_profesor_id ?? 'sin-profe'
    if (!grupos[pid]) {
      grupos[pid] = {
        profe: a.evento_profesor?.profesor,
        color: COLORES[Object.keys(grupos).length % COLORES.length],
        alumnos: [],
      }
    }
    grupos[pid].alumnos.push(a)
  })

  const totalPendiente = alumnos.filter(a => a.estado === 'pendiente').length

  return (
    <div style={{ background: ios.bg, minHeight: '100vh' }}>
      <NavBar titulo="Alumnos" />

      <div style={{ padding: '0 16px 8px' }}>
        {/* Buscador */}
        <div style={{ background: ios.fill, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: ios.label3 }}>🔍</span>
          <input
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            placeholder="Buscar por nombre o profe…"
            style={{ flex: 1, background: 'none', border: 'none', fontSize: 16, color: ios.label, fontFamily: ios.font, outline: 'none' }}
          />
          {buscar && (
            <button onClick={() => setBuscar('')} style={{ background: ios.label4, border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 12, color: ios.label3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          )}
        </div>

        {/* Segmented */}
        <SegmentedControl
          opciones={[
            { id: 'todos', label: 'Todos' },
            { id: 'pendiente', label: `Pendiente${totalPendiente > 0 ? ` (${totalPendiente})` : ''}` },
            { id: 'confirmado', label: 'Confirmado' },
            { id: 'efectivo', label: 'Efectivo' },
          ]}
          activo={filtro}
          onChange={setFiltro}
        />
      </div>

      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: ios.label3, fontFamily: ios.font }}>Cargando...</div>
        ) : Object.keys(grupos).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 16, color: ios.label3, fontFamily: ios.font }}>Sin resultados</div>
          </div>
        ) : (
          Object.entries(grupos).map(([pid, grupo]) => (
            <div key={pid}>
              {/* Header del grupo */}
              {grupo.profe && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 8px' }}>
                  <Avatar nombre={grupo.profe.nombre} color={grupo.color} size={24} />
                  <span style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {grupo.profe.nombre}
                  </span>
                </div>
              )}

              {/* Alumnos del grupo */}
              <div style={{ borderRadius: 12, overflow: 'hidden', background: ios.card }}>
                {grupo.alumnos.map((a, i) => {
                  const est = estadoMap[a.estado]
                  const waLink = waLinks[a.id]
                  return (
                    <div key={a.id}>
                      {i > 0 && <div style={{ height: '0.5px', background: ios.sep, marginLeft: 60 }} />}
                      <div style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Avatar */}
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: ios.fill, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: ios.label3, fontFamily: ios.font, flexShrink: 0 }}>
                            {a.nombre.charAt(0)}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: ios.font, fontSize: 16, color: ios.label, fontWeight: 500 }}>{a.nombre}</div>
                            <div style={{ fontFamily: ios.font, fontSize: 13, color: ios.label3, marginTop: 1 }}>{a.metodo_pago}</div>
                          </div>
                          {/* Estado + acción */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                            <Pill label={est.label} color={est.color} bg={est.bg} />
                            {a.estado === 'pendiente' && (
                              <button
                                onClick={() => confirmarPago(a)}
                                disabled={confirmando === a.id}
                                style={{
                                  background: ios.green + '1A', border: 'none', borderRadius: 8,
                                  padding: '4px 10px', fontSize: 13, color: ios.green,
                                  cursor: 'pointer', fontFamily: ios.font, fontWeight: 500,
                                  opacity: confirmando === a.id ? 0.6 : 1,
                                }}
                              >
                                {confirmando === a.id ? '...' : 'Confirmar pago'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Botón WA manual post-confirmación */}
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
                              background: '#25D366' + '1A', borderRadius: 8, padding: '6px 10px',
                              textDecoration: 'none', fontSize: 13, color: '#25D366', fontFamily: ios.font, fontWeight: 500,
                            }}
                          >
                            💬 Enviar ticket por WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
