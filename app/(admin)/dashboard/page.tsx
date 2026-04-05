'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ios, NavBar, StatCard, Avatar } from '@/components/ui/ios'
import { formatearPrecio } from '@/lib/utils'
import type { StatsEvento, EventoProfesor } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<StatsEvento | null>(null)
  const [profes, setProfes] = useState<EventoProfesor[]>([])
  const [evento, setEvento] = useState<any>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const supabase = createClient()

    // Evento activo
    const { data: ev } = await supabase
      .from('eventos')
      .select('*')
      .eq('activo', true)
      .single()

    if (!ev) { setCargando(false); return }
    setEvento(ev)

    // Profes con conteos
    const { data: eps } = await supabase
      .from('evento_profesores')
      .select(`*, profesor:profesores(*)`)
      .eq('evento_id', ev.id)

    // Asistentes
    const { data: asistentes } = await supabase
      .from('asistentes')
      .select('estado, asistio, evento_profesor_id')
      .eq('evento_id', ev.id)

    if (asistentes) {
      const total = asistentes.length
      const confirmados = asistentes.filter(a => a.estado === 'confirmado').length
      const pendientes = asistentes.filter(a => a.estado === 'pendiente').length
      const efectivo = asistentes.filter(a => a.estado === 'efectivo').length
      const asistieron = asistentes.filter(a => a.asistio).length

      setStats({
        total_asistentes: total,
        confirmados,
        pendientes,
        efectivo,
        asistieron,
        profes_gratis: eps?.filter(p => (p as any).ticket_estado === 'gratis').length ?? 0,
        profes_pagan: eps?.filter(p => (p as any).ticket_estado !== 'gratis').length ?? 0,
        recaudado: (confirmados + efectivo) * ev.precio,
      })

      // Calcular totales por profe
      const profesConConteo = (eps ?? []).map(ep => ({
        ...ep,
        total_alumnos: asistentes.filter(a => a.evento_profesor_id === ep.id).length,
        alumnos_confirmados: asistentes.filter(a => a.evento_profesor_id === ep.id && ['confirmado', 'efectivo'].includes(a.estado)).length,
      }))
      setProfes(profesConConteo as any)
    }

    setCargando(false)
  }

  const COLORES = ['#AF52DE', '#FF2D55', '#FF9500', '#007AFF', '#34C759']

  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ color: ios.label3, fontFamily: ios.font }}>Cargando...</span>
      </div>
    )
  }

  if (!evento) {
    return (
      <div style={{ padding: 24 }}>
        <NavBar titulo="Resumen" />
        <div style={{ textAlign: 'center', padding: '60px 24px', color: ios.label3, fontFamily: ios.font }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: ios.label, marginBottom: 8 }}>Sin evento activo</div>
          <div style={{ fontSize: 15 }}>Creá un evento desde la pestaña Evento</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: ios.bg, minHeight: '100vh' }}>
      <NavBar titulo="Resumen" accionLabel="Scanner" onAccion={() => router.push('/scanner')} />

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Nombre del evento */}
        <div style={{ background: 'linear-gradient(135deg,#5856D6,#FF2D55)', borderRadius: 16, padding: '16px 20px', color: 'white' }}>
          <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: ios.font }}>Evento activo</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: ios.font, marginTop: 4 }}>{evento.nombre}</div>
          <div style={{ fontSize: 14, opacity: 0.75, fontFamily: ios.font, marginTop: 4 }}>
            {new Date(evento.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {evento.lugar}
          </div>
        </div>

        {/* Stats 2×2 */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatCard valor={stats.total_asistentes} label="Total inscriptos" color={ios.blue} icono="👥" />
            <StatCard valor={stats.confirmados + stats.efectivo} label="Pagos confirmados" color={ios.green} icono="✅" />
            <StatCard valor={stats.pendientes} label="Pagos pendientes" color={ios.orange} icono="⏳" />
            <StatCard valor={formatearPrecio(stats.recaudado)} label="Recaudado" color={ios.purple} icono="💰" />
          </div>
        )}

        {/* Barra de progreso */}
        {stats && stats.total_asistentes > 0 && (
          <div>
            <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Progreso de cobros
            </div>
            <div style={{ background: ios.card, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: ios.font, fontSize: 15, color: ios.label }}>
                  {stats.confirmados + stats.efectivo} de {stats.total_asistentes} pagaron
                </span>
                <span style={{ fontFamily: ios.font, fontSize: 15, fontWeight: 600, color: ios.green }}>
                  {Math.round(((stats.confirmados + stats.efectivo) / stats.total_asistentes) * 100)}%
                </span>
              </div>
              <div style={{ height: 6, background: ios.fill, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((stats.confirmados + stats.efectivo) / stats.total_asistentes) * 100}%`,
                  background: ios.green, borderRadius: 999, transition: 'width 0.6s'
                }} />
              </div>
              {stats.asistieron > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: ios.label3, fontFamily: ios.font }}>
                  🏃 {stats.asistieron} asistieron al evento
                </div>
              )}
            </div>
          </div>
        )}

        {/* Por profe */}
        {profes.length > 0 && (
          <div>
            <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Por profe
            </div>
            <div style={{ borderRadius: 12, overflow: 'hidden', background: ios.card }}>
              {profes.map((ep, i) => {
                const p = (ep as any).profesor
                const libre = (ep as any).ticket_estado === 'gratis'
                const total = ep.total_alumnos ?? 0
                const conf = ep.alumnos_confirmados ?? 0
                return (
                  <div key={ep.id}>
                    {i > 0 && <div style={{ height: '0.5px', background: ios.sep, marginLeft: 64 }} />}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12 }}>
                      <Avatar nombre={p?.nombre ?? '?'} color={COLORES[i % COLORES.length]} size={38} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: ios.font, fontSize: 15, color: ios.label, fontWeight: 500 }}>{p?.nombre}</div>
                        <div style={{ height: 3, background: ios.fill, borderRadius: 999, marginTop: 5, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${total > 0 ? (conf / total) * 100 : 0}%`, background: libre ? ios.green : COLORES[i % COLORES.length], borderRadius: 999 }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: ios.font, fontSize: 15, fontWeight: 600, color: libre ? ios.green : ios.label }}>{conf}/{total}</div>
                        {libre && <div style={{ fontSize: 11, color: ios.green, fontFamily: ios.font }}>Gratis 🎟</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
