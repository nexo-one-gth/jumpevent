'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ios, NavBar, Group, Cell, IOSSwitch, BottomSheet, InputField, BtnPrimario } from '@/components/ui/ios'
import { formatearPrecio } from '@/lib/utils'
import type { Evento } from '@/types'

type CampoEditable = 'nombre' | 'fecha' | 'lugar' | 'precio' | 'alias_transferencia' | 'min_alumnos_gratis' | 'wa_comprobantes' | 'link_fotos' | 'link_video' | 'link_tracks'

const CAMPOS: Record<CampoEditable, { titulo: string; tipo?: string; placeholder?: string; opcional?: boolean }> = {
  nombre:              { titulo: 'Nombre del evento',               placeholder: 'Jumping Master Class' },
  fecha:               { titulo: 'Fecha',                           tipo: 'date' },
  lugar:               { titulo: 'Lugar',                           placeholder: 'Club Atlético Morón, Salón Principal' },
  precio:              { titulo: 'Precio de entrada ($)',           tipo: 'number', placeholder: '5000' },
  alias_transferencia: { titulo: 'Alias de transferencia',          placeholder: 'jumping.eventos' },
  min_alumnos_gratis:  { titulo: 'Mínimo alumnos para entrada gratis', tipo: 'number', placeholder: '6' },
  wa_comprobantes:     { titulo: 'WhatsApp comprobantes',           tipo: 'tel', placeholder: '5491145678900', opcional: true },
  link_fotos:          { titulo: 'Link de fotos',                   placeholder: 'https://...', opcional: true },
  link_video:          { titulo: 'Link de video',                   placeholder: 'https://...', opcional: true },
  link_tracks:         { titulo: 'Link de tracks',                  placeholder: 'https://...', opcional: true },
}

const CAMPOS_NUMERICOS: CampoEditable[] = ['precio', 'min_alumnos_gratis']

export default function EventoPage() {
  const [evento, setEvento] = useState<Evento | null>(null)
  const [cargando, setCargando] = useState(true)
  const [pin, setPin] = useState('')
  const [pinCopiado, setPinCopiado] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const flyerRef = useRef<HTMLInputElement>(null)

  // Edición de campo individual
  const [campoEditando, setCampoEditando] = useState<CampoEditable | null>(null)
  const [valorEdicion, setValorEdicion] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Creación de evento
  const [sheetCrear, setSheetCrear] = useState(false)
  const [formCrear, setFormCrear] = useState({
    nombre: '', fecha: '', lugar: '', precio: '',
    alias_transferencia: '', min_alumnos_gratis: '6', wa_comprobantes: '',
  })
  const [creando, setCreando] = useState(false)

  useEffect(() => { cargarEvento() }, [])

  async function cargarEvento() {
    const supabase = createClient()
    const { data } = await supabase.from('eventos').select('*').eq('activo', true).single()
    if (data) {
      setEvento(data)
      const { data: pinData } = await supabase
        .from('scanner_pins').select('pin')
        .eq('evento_id', data.id).eq('activo', true).single()
      if (pinData) setPin(pinData.pin)
    }
    setCargando(false)
  }

  function abrirEdicion(campo: CampoEditable, valor: string) {
    setCampoEditando(campo)
    setValorEdicion(valor)
  }

  async function guardarCampo() {
    if (!evento || !campoEditando) return
    setGuardando(true)
    const supabase = createClient()
    const esNumerico = CAMPOS_NUMERICOS.includes(campoEditando)
    const valorGuardar = esNumerico ? Number(valorEdicion) : (valorEdicion.trim() || null)
    await supabase.from('eventos').update({ [campoEditando]: valorGuardar }).eq('id', evento.id)
    setEvento({ ...evento, [campoEditando]: valorGuardar })
    setCampoEditando(null)
    setGuardando(false)
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
    await supabase.from('scanner_pins').update({ activo: false }).eq('evento_id', evento.id)
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

  async function crearEvento() {
    setCreando(true)
    const supabase = createClient()
    const { data } = await supabase.from('eventos').insert({
      nombre: formCrear.nombre,
      fecha: formCrear.fecha,
      lugar: formCrear.lugar,
      precio: Number(formCrear.precio),
      alias_transferencia: formCrear.alias_transferencia,
      min_alumnos_gratis: Number(formCrear.min_alumnos_gratis) || 6,
      wa_comprobantes: formCrear.wa_comprobantes || null,
      activo: true,
      contenido_activo: false,
    }).select().single()
    if (data) {
      setEvento(data)
      setSheetCrear(false)
    }
    setCreando(false)
  }

  const puedeCrear = formCrear.nombre && formCrear.fecha && formCrear.lugar && formCrear.precio && formCrear.alias_transferencia

  // ── Loading ───────────────────────────────────────────────────
  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ color: ios.label3, fontFamily: ios.font }}>Cargando...</span>
      </div>
    )
  }

  // ── Sin evento activo ─────────────────────────────────────────
  if (!evento) {
    return (
      <div style={{ background: ios.bg, minHeight: '100vh' }}>
        <NavBar titulo="Evento" />
        <div style={{ padding: '60px 24px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: ios.label, fontFamily: ios.font, marginBottom: 8 }}>Sin evento activo</div>
          <div style={{ fontSize: 15, color: ios.label3, fontFamily: ios.font, marginBottom: 32, lineHeight: 1.5 }}>
            Creá tu primer evento para empezar a gestionar inscripciones.
          </div>
          <BtnPrimario label="Crear evento" onClick={() => setSheetCrear(true)} />
        </div>

        <BottomSheet abierto={sheetCrear} onCerrar={() => setSheetCrear(false)} titulo="Nuevo evento">
          <InputField label="Nombre" value={formCrear.nombre} onChange={v => setFormCrear(f => ({ ...f, nombre: v }))} placeholder="Jumping Master Class" requerido />
          <InputField label="Fecha" value={formCrear.fecha} onChange={v => setFormCrear(f => ({ ...f, fecha: v }))} type="date" requerido />
          <InputField label="Lugar" value={formCrear.lugar} onChange={v => setFormCrear(f => ({ ...f, lugar: v }))} placeholder="Club Atlético Morón, Salón Principal" requerido />
          <InputField label="Precio de entrada ($)" value={formCrear.precio} onChange={v => setFormCrear(f => ({ ...f, precio: v }))} type="number" placeholder="5000" requerido />
          <InputField label="Alias transferencia" value={formCrear.alias_transferencia} onChange={v => setFormCrear(f => ({ ...f, alias_transferencia: v }))} placeholder="jumping.eventos" requerido />
          <InputField label="Mínimo alumnos para entrada gratis" value={formCrear.min_alumnos_gratis} onChange={v => setFormCrear(f => ({ ...f, min_alumnos_gratis: v }))} type="number" placeholder="6" />
          <InputField label="WhatsApp comprobantes" value={formCrear.wa_comprobantes} onChange={v => setFormCrear(f => ({ ...f, wa_comprobantes: v }))} type="tel" placeholder="5491145678900" />
          <div style={{ marginTop: 8 }}>
            <BtnPrimario label={creando ? 'Creando...' : 'Crear evento'} onClick={crearEvento} disabled={creando || !puedeCrear} />
          </div>
        </BottomSheet>
      </div>
    )
  }

  // ── Evento activo ─────────────────────────────────────────────
  const configCampo = campoEditando ? CAMPOS[campoEditando] : null
  const puedeGuardar = !guardando && (configCampo?.opcional ? true : !!valorEdicion.trim())

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
          <Cell label="Nombre" detail={evento.nombre} chevron onPress={() => abrirEdicion('nombre', evento.nombre)} />
          <Cell label="Fecha" detail={new Date(evento.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} chevron onPress={() => abrirEdicion('fecha', evento.fecha.substring(0, 10))} />
          <Cell label="Lugar" detail={evento.lugar} chevron onPress={() => abrirEdicion('lugar', evento.lugar)} />
        </Group>

        {/* Datos de cobro */}
        <Group label="Cobros">
          <Cell label="Precio de entrada" value={formatearPrecio(evento.precio)} chevron onPress={() => abrirEdicion('precio', String(evento.precio))} />
          <Cell label="Alias transferencia" value={evento.alias_transferencia} chevron onPress={() => abrirEdicion('alias_transferencia', evento.alias_transferencia)} />
          <Cell label="Mínimo alumnos gratis" value={`${evento.min_alumnos_gratis} alumnos`} chevron onPress={() => abrirEdicion('min_alumnos_gratis', String(evento.min_alumnos_gratis))} />
          <Cell label="WhatsApp comprobantes" detail={evento.wa_comprobantes ? `+${evento.wa_comprobantes}` : 'Sin configurar'} chevron onPress={() => abrirEdicion('wa_comprobantes', evento.wa_comprobantes ?? '')} />
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
            <Cell label="📸 Fotos" detail={evento.link_fotos ?? 'Sin configurar'} chevron onPress={() => abrirEdicion('link_fotos', evento.link_fotos ?? '')} />
            <Cell label="🎥 Video" detail={evento.link_video ?? 'Sin configurar'} chevron onPress={() => abrirEdicion('link_video', evento.link_video ?? '')} />
            <Cell label="🎵 Tracks" detail={evento.link_tracks ?? 'Sin configurar'} chevron onPress={() => abrirEdicion('link_tracks', evento.link_tracks ?? '')} />
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
                <button onClick={copiarPin} style={{ flex: 1, background: pinCopiado ? ios.green + '1A' : ios.fill, border: 'none', borderRadius: 10, padding: '9px', fontSize: 14, color: pinCopiado ? ios.green : ios.label3, cursor: 'pointer', fontFamily: ios.font }}>
                  {pinCopiado ? '✓ PIN copiado' : 'Copiar PIN'}
                </button>
                <button onClick={copiarLink} style={{ flex: 1, background: linkCopiado ? ios.green + '1A' : ios.fill, border: 'none', borderRadius: 10, padding: '9px', fontSize: 14, color: linkCopiado ? ios.green : ios.blue, cursor: 'pointer', fontFamily: ios.font }}>
                  {linkCopiado ? '✓ Link copiado' : 'Copiar link scanner'}
                </button>
              </div>
            )}
          </div>
        </Group>

      </div>

      {/* Bottom sheet edición de campo */}
      <BottomSheet abierto={!!campoEditando} onCerrar={() => setCampoEditando(null)} titulo={configCampo?.titulo ?? ''}>
        {configCampo && (
          <>
            <InputField
              label={configCampo.titulo}
              value={valorEdicion}
              onChange={setValorEdicion}
              type={configCampo.tipo}
              placeholder={configCampo.placeholder}
            />
            <div style={{ marginTop: 8 }}>
              <BtnPrimario label={guardando ? 'Guardando...' : 'Guardar'} onClick={guardarCampo} disabled={!puedeGuardar} />
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  )
}
