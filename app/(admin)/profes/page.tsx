'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ios, NavBar, Avatar, Pill, BottomSheet, InputField, BtnPrimario, Group, Cell } from '@/components/ui/ios'
import { slugify } from '@/lib/utils'
import type { EventoProfesor, Profesor } from '@/types'

const COLORES = ['#AF52DE', '#FF2D55', '#FF9500', '#007AFF', '#34C759', '#5856D6']

export default function ProfesPage() {
  const [profes, setProfes] = useState<(EventoProfesor & { profesor: Profesor; total_alumnos: number; alumnos_confirmados: number })[]>([])
  const [eventoId, setEventoId] = useState<string>('')
  const [cargando, setCargando] = useState(true)
  const [sheetAbierto, setSheetAbierto] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  // Formulario nuevo profe
  const [form, setForm] = useState({ nombre: '', ig: '', tiktok: '', telefono: '', slug: '' })
  const [slugCustom, setSlugCustom] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    const supabase = createClient()
    const { data: ev } = await supabase.from('eventos').select('id').eq('activo', true).single()
    if (!ev) { setCargando(false); return }
    setEventoId(ev.id)

    const { data: eps } = await supabase
      .from('evento_profesores')
      .select(`*, profesor:profesores(*)`)
      .eq('evento_id', ev.id)

    const { data: asistentes } = await supabase
      .from('asistentes')
      .select('estado, evento_profesor_id')
      .eq('evento_id', ev.id)

    const profesConConteo = (eps ?? []).map((ep, i) => ({
      ...ep,
      total_alumnos: asistentes?.filter(a => a.evento_profesor_id === ep.id).length ?? 0,
      alumnos_confirmados: asistentes?.filter(a => a.evento_profesor_id === ep.id && ['confirmado', 'efectivo'].includes(a.estado)).length ?? 0,
      _color: COLORES[i % COLORES.length],
    }))

    setProfes(profesConConteo as any)
    setCargando(false)
  }

  function handleNombre(v: string) {
    setForm(f => ({ ...f, nombre: v, slug: slugCustom ? f.slug : slugify(v) }))
  }

  async function guardarProfe() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Requerido'
    if (!form.slug.trim()) e.slug = 'Requerido'
    setErrores(e)
    if (Object.keys(e).length) return

    const supabase = createClient()

    // 1. Crear profe global
    const { data: profe, error: pe } = await supabase
      .from('profesores')
      .insert({ nombre: form.nombre, instagram: form.ig || null, tiktok: form.tiktok || null, telefono: form.telefono || null })
      .select().single()

    if (pe) { setErrores({ nombre: 'Error al guardar' }); return }

    // 2. Asignar al evento
    const { error: epe } = await supabase
      .from('evento_profesores')
      .insert({ evento_id: eventoId, profesor_id: profe.id, slug: form.slug })

    if (epe) { setErrores({ slug: 'Ese link ya existe, probá otro' }); return }

    setGuardado(true)
    setTimeout(() => {
      setGuardado(false)
      setSheetAbierto(false)
      setForm({ nombre: '', ig: '', tiktok: '', telefono: '', slug: '' })
      setSlugCustom(false)
      cargarDatos()
    }, 1600)
  }

  function copiarLink(slug: string) {
    const url = `${window.location.origin}/inscripcion/${slug}`
    navigator.clipboard.writeText(url).catch(() => {})
    setLinkCopiado(slug)
    setTimeout(() => setLinkCopiado(null), 2000)
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tu-app.vercel.app'

  return (
    <div style={{ background: ios.bg, minHeight: '100vh' }}>
      <NavBar titulo="Profes invitados" accionLabel="+" onAccion={() => setSheetAbierto(true)} />

      <div style={{ padding: '16px' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: ios.label3, fontFamily: ios.font }}>Cargando...</div>
        ) : profes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧑‍🏫</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: ios.label, fontFamily: ios.font, marginBottom: 8 }}>Sin profes aún</div>
            <div style={{ fontSize: 15, color: ios.label3, fontFamily: ios.font, marginBottom: 20 }}>Agregá profes invitados con el botón +</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profes.map((ep, i) => {
              const p = ep.profesor
              const libre = ep.ticket_estado === 'gratis'
              const color = (ep as any)._color || COLORES[i % COLORES.length]
              return (
                <div key={ep.id} style={{ background: ios.card, borderRadius: 16, border: `0.5px solid ${libre ? ios.green + '44' : ios.sep}`, overflow: 'hidden' }}>
                  {/* Header profe */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12 }}>
                    <Avatar nombre={p.nombre} color={color} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: ios.font, fontSize: 16, fontWeight: 600, color: ios.label }}>{p.nombre}</span>
                        {libre
                          ? <Pill label="Entrada gratis 🎟" color={ios.green} bg={ios.green + '1A'} />
                          : <Pill label="Paga entrada" color={ios.orange} bg={ios.orange + '1A'} />
                        }
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {p.instagram && <span style={{ fontSize: 12, color: ios.label3, fontFamily: ios.font }}>IG {p.instagram}</span>}
                        {p.tiktok && <span style={{ fontSize: 12, color: ios.label3, fontFamily: ios.font }}>TT {p.tiktok}</span>}
                      </div>
                    </div>
                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
                      {[
                        { v: ep.total_alumnos, l: 'alumnos', c: libre ? ios.green : ios.label },
                        { v: ep.alumnos_confirmados, l: 'pagaron', c: ios.green },
                        { v: ep.total_alumnos - ep.alumnos_confirmados, l: 'pendiente', c: ios.orange },
                      ].map(s => (
                        <div key={s.l} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: s.c, fontFamily: ios.font, lineHeight: 1 }}>{s.v}</div>
                          <div style={{ fontSize: 10, color: ios.label3, fontFamily: ios.font, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Barra progreso + link */}
                  <div style={{ padding: '0 16px 12px' }}>
                    {libre && (
                      <div style={{ fontSize: 11, color: ios.green, background: ios.green + '1A', borderRadius: 8, padding: '4px 10px', marginBottom: 8, display: 'inline-block' }}>
                        ✅ {ep.total_alumnos} alumnos → entrada gratis automática
                      </div>
                    )}
                    <div style={{ height: 3, background: ios.fill, borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ height: '100%', width: `${ep.total_alumnos > 0 ? (ep.alumnos_confirmados / ep.total_alumnos) * 100 : 0}%`, background: libre ? ios.green : color, borderRadius: 999 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 11, color: ios.label3, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {appUrl}/inscripcion/{ep.slug}
                      </div>
                      <button
                        onClick={() => copiarLink(ep.slug)}
                        style={{
                          background: linkCopiado === ep.slug ? ios.green + '1A' : ios.fill,
                          border: 'none', borderRadius: 8, padding: '5px 12px',
                          fontSize: 13, color: linkCopiado === ep.slug ? ios.green : ios.blue,
                          cursor: 'pointer', fontFamily: ios.font, fontWeight: 500, flexShrink: 0,
                          transition: 'all 0.2s',
                        }}
                      >
                        {linkCopiado === ep.slug ? '✓ Copiado' : 'Copiar link'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom sheet agregar profe */}
      <BottomSheet abierto={sheetAbierto} onCerrar={() => { setSheetAbierto(false); setGuardado(false) }} titulo="Nuevo profe">
        {guardado ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: ios.font, fontSize: 20, fontWeight: 700, color: ios.label }}>¡Profe agregado!</div>
            <div style={{ fontSize: 14, color: ios.label3, fontFamily: ios.font, marginTop: 6 }}>Link de inscripción listo</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, marginBottom: 16, lineHeight: 1.4 }}>
              El profe queda guardado en el sistema y puede participar en futuros eventos.
            </div>

            <InputField label="Nombre completo" value={form.nombre} onChange={handleNombre} placeholder="Luciana Méndez" requerido error={errores.nombre} />
            <InputField label="Instagram" value={form.ig} onChange={v => setForm(f => ({ ...f, ig: v }))} placeholder="@lu.jumping" />
            <InputField label="TikTok" value={form.tiktok} onChange={v => setForm(f => ({ ...f, tiktok: v }))} placeholder="@lumendez" />
            <InputField label="WhatsApp" value={form.telefono} onChange={v => setForm(f => ({ ...f, telefono: v }))} placeholder="11 4567-8901" type="tel" />

            {/* Slug del link */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, marginBottom: 5 }}>
                Link de inscripción <span style={{ color: ios.pink }}>*</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: ios.fill2, borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${errores.slug ? ios.red : 'transparent'}` }}>
                <span style={{ fontSize: 14, color: ios.label3, padding: '11px 0 11px 14px', fontFamily: ios.font, whiteSpace: 'nowrap' }}>…/inscripcion/</span>
                <input
                  value={form.slug}
                  onChange={e => { setSlugCustom(true); setForm(f => ({ ...f, slug: slugify(e.target.value) })) }}
                  placeholder="lu-mendez"
                  style={{ flex: 1, background: 'none', border: 'none', padding: '11px 14px 11px 4px', fontSize: 15, color: ios.blue, fontFamily: 'monospace', outline: 'none' }}
                />
              </div>
              {errores.slug
                ? <div style={{ fontSize: 12, color: ios.red, marginTop: 3 }}>{errores.slug}</div>
                : <div style={{ fontSize: 12, color: ios.label3, marginTop: 3, fontFamily: ios.font }}>Personalizá el link para este evento</div>
              }
            </div>

            <BtnPrimario label="Guardar profe" onClick={guardarProfe} disabled={!form.nombre.trim() || !form.slug.trim()} />
          </>
        )}
      </BottomSheet>
    </div>
  )
}
