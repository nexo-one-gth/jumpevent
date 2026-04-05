'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ios, NavBar, Group, Cell, IOSSwitch } from '@/components/ui/ios'
import { formatearPrecio } from '@/lib/utils'
import type { Evento } from '@/types'

export default function EventoPage() {
  const [evento, setEvento] = useState<Evento | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [pinCopiado, setPinCopiado] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [pin, setPin] = useState('')
  const flyerRef = useRef<HTMLInputElement>(null)

  useEffect(() => { cargarEvento() }, [])

  async function cargarEvento() {
    const supabase = createClient()
    const { data } = await supabase.from('eventos').select('*').eq('activo', true).single()
    if (data) {
      setEvento(data)
      // Cargar PIN existente
      const { data: pinData } = await supabase
        .from('scanner_pins')
        .select('pin')
        .eq('evento_id', data.id)
        .eq('activo', true)
        .single()
      if (pinData) setPin(pinData.pin)
    }
    setCargando(false)
  }

  async function toggleContenido() {
    if (!evento) return
    const supabase = createClient()
    const nuevo = !evento.contenido_activo
    await supabase.from('eventos').update({ contenido_activo: nuevo }).eq('id', evento.id)
    setEvento({ ...evento, contenido_activo: nuevo })
  }

  async function generarPin() {
    if (!evento) return
    const supabase = createClient()
    const nuevoPIN = Math.floor(1000 + Math.random() * 8999).toString()
    // Desactivar PINs anteriores
    await supabase.from('scanner_pins').update({ activo: false }).eq('evento_id', evento.id)
    // Crear nuevo
    await supabase.from('scanner_pins').insert({ evento_id: evento.id, pin: nuevoPIN })
    setPin(nuevoPIN)
  }

  function copiarPin() {
    navigator.clipboard.writeText(pin).catch(() => {})
    setPinCopiado(true)
    setTimeout(() => setPinCopiado(false), 2000)
  }

  function copiarLink() {
    navigator.clipboard.writeText(`${window.location.origin}/scanner`).catch(() => {})
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  async function handleFlyer(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !evento) return
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `flyeres/${evento.id}.${ext}`
    const { error } = await supabase.storage.from('eventos').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('eventos').getPublicUrl(path)
      await supabase.from('eventos').update({ flyer_url: publicUrl }).eq('id', evento.id)
      setEvento({ ...evento, flyer_url: publicUrl })
    }
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ color: ios.label3, fontFamily: ios.font }}>Cargando...</span>
      </div>
    )
  }

  if (!evento) {
    return (
      <div style={{ background: ios.bg, minHeight: '100vh' }}>
        <NavBar titulo="Evento" />
        <div style={{ textAlign: 'center', padding: '60px 24px', color: ios.label3, fontFamily: ios.font }}>
          Sin evento activo
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: ios.bg, minHeight: '100vh' }}>
      <NavBar titulo="Evento" />

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Flyer */}
        <div>
          <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Flyer del evento</div>
          <div
            onClick={() => flyerRef.current?.click()}
            style={{
              borderRadius: 14, overflow: 'hidden', background: ios.card,
              minHeight: evento.flyer_url ? 'auto' : 140,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              border: evento.flyer_url ? 'none' : `1.5px dashed ${ios.label4}`,
            }}
          >
            {evento.flyer_url
              ? <img src={evento.flyer_url} alt="flyer" style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }} />
              : (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                  <div style={{ fontSize: 16, color: ios.blue, fontFamily: ios.font }}>Subir flyer</div>
                  <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, marginTop: 4 }}>JPG o PNG · 1080×1080 px</div>
                </div>
              )
            }
          </div>
          <input ref={flyerRef} type="file" accept="image/*" onChange={handleFlyer} style={{ display: 'none' }} />
          {evento.flyer_url && (
            <button onClick={() => flyerRef.current?.click()} style={{ background: 'none', border: 'none', color: ios.blue, fontSize: 15, fontFamily: ios.font, padding: '8px 0', cursor: 'pointer' }}>
              Cambiar imagen
            </button>
          )}
        </div>

        {/* Info del evento */}
        <Group label="Información">
          <Cell label="Nombre" detail={evento.nombre} chevron />
          <Cell label="Fecha" detail={new Date(evento.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} chevron />
          <Cell label="Lugar" detail={evento.lugar} chevron />
        </Group>

        {/* Datos de cobro */}
        <Group label="Cobros">
          <Cell label="Precio de entrada" value={formatearPrecio(evento.precio)} />
          <Cell label="Alias transferencia" value={evento.alias_transferencia} />
          <Cell label="Mínimo alumnos gratis" value={`${evento.min_alumnos_gratis} alumnos`} />
          {evento.wa_comprobantes && (
            <Cell label="WhatsApp comprobantes" detail={`+${evento.wa_comprobantes}`} />
          )}
        </Group>

        {/* Contenido post-evento */}
        <Group label="Contenido post-evento" footer="Al activarlo, las asistentes verán fotos, videos y tracks desde su ticket digital.">
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: ios.card, gap: 12 }}>
            <span style={{ flex: 1, fontSize: 17, color: ios.label, fontFamily: ios.font }}>Activar contenido</span>
            <IOSSwitch activo={evento.contenido_activo} onToggle={toggleContenido} />
          </div>
        </Group>

        {evento.contenido_activo && (
          <Group label="Links de contenido">
            <Cell label="📸 Fotos" detail={evento.link_fotos ?? 'Sin configurar'} chevron />
            <Cell label="🎥 Video" detail={evento.link_video ?? 'Sin configurar'} chevron />
            <Cell label="🎵 Tracks" detail={evento.link_tracks ?? 'Sin configurar'} chevron />
          </Group>
        )}

        {/* Scanner */}
        <Group label="Scanner QR (día del evento)" footer="Compartí el PIN y el link con las colaboradoras antes del evento.">
          <div style={{ padding: '14px 16px', background: ios.card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, marginBottom: 4 }}>PIN del scanner</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: ios.label, fontFamily: 'monospace', letterSpacing: '0.2em' }}>
                  {pin || '----'}
                </div>
              </div>
              <button
                onClick={generarPin}
                style={{ background: ios.blue + '1A', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 14, color: ios.blue, cursor: 'pointer', fontFamily: ios.font, fontWeight: 500 }}
              >
                {pin ? 'Regenerar' : 'Generar PIN'}
              </button>
            </div>
            {pin && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={copiarPin}
                  style={{ flex: 1, background: pinCopiado ? ios.green + '1A' : ios.fill, border: 'none', borderRadius: 10, padding: '9px', fontSize: 14, color: pinCopiado ? ios.green : ios.label3, cursor: 'pointer', fontFamily: ios.font }}
                >
                  {pinCopiado ? '✓ PIN copiado' : 'Copiar PIN'}
                </button>
                <button
                  onClick={copiarLink}
                  style={{ flex: 1, background: linkCopiado ? ios.green + '1A' : ios.fill, border: 'none', borderRadius: 10, padding: '9px', fontSize: 14, color: linkCopiado ? ios.green : ios.blue, cursor: 'pointer', fontFamily: ios.font }}
                >
                  {linkCopiado ? '✓ Link copiado' : 'Copiar link scanner'}
                </button>
              </div>
            )}
          </div>
        </Group>

      </div>
    </div>
  )
}
