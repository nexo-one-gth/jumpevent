'use client'

import { useState, useEffect, useRef } from 'react'
import { ios } from '@/components/ui/ios'

type ResultadoEstado = 'acceso_ok' | 'ya_escaneado' | 'invalido' | 'pago_pendiente' | 'error' | null

interface ResultadoScan {
  estado: ResultadoEstado
  nombre?: string
  profe?: string
}

export default function ScannerPage() {
  const [pin, setPin] = useState('')
  const [pinIngresado, setPinIngresado] = useState('')
  const [eventoId, setEventoId] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [resultado, setResultado] = useState<ResultadoScan>({ estado: null })
  const [escaneando, setEscaneando] = useState(false)
  const scannerRef = useRef<any>(null)
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Obtener evento activo del localStorage (la organizadora lo configura)
    const eid = localStorage.getItem('jumping_evento_id') || ''
    setEventoId(eid)
  }, [])

  async function verificarPin() {
    const res = await fetch('/api/scanner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_token: 'ping', pin: pinIngresado, evento_id: eventoId }),
    })
    // Si responde 401 el PIN está mal; si responde 400 (sin token) el PIN está bien
    if (res.status === 400) {
      setAutenticado(true)
      setPinError(false)
      iniciarScanner()
    } else {
      setPinError(true)
    }
  }

  async function iniciarScanner() {
    if (typeof window === 'undefined') return
    setEscaneando(true)
    // Importar dinámicamente para evitar SSR
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText: string) => {
        // Extraer token del URL o usar directo
        const token = decodedText.includes('/ticket/')
          ? decodedText.split('/ticket/').pop()!
          : decodedText

        await scanner.pause()
        await procesarScan(token)
      },
      () => {} // error silencioso de frames
    )
  }

  async function procesarScan(qr_token: string) {
    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token, pin: pinIngresado, evento_id: eventoId }),
      })
      const data = await res.json()

      if (!data.ok) {
        setResultado({ estado: data.mensaje })
      } else {
        setResultado({
          estado: data.mensaje,
          nombre: data.asistente?.nombre,
          profe: data.asistente?.evento_profesor?.profesor?.nombre,
        })
      }
    } catch {
      setResultado({ estado: 'error' })
    }
  }

  function siguienteScan() {
    setResultado({ estado: null })
    scannerRef.current?.resume()
  }

  const resultadoConfig = {
    acceso_ok: {
      color: ios.green, bg: ios.green + '15',
      icono: '✅', titulo: 'ACCESO OK',
      subtitulo: (r: ResultadoScan) => `${r.nombre}\n${r.profe ? `con ${r.profe}` : ''}`,
    },
    ya_escaneado: {
      color: ios.orange, bg: ios.orange + '15',
      icono: '⚠️', titulo: 'YA ESCANEADO',
      subtitulo: (r: ResultadoScan) => `${r.nombre}\nEste QR ya fue usado`,
    },
    invalido: {
      color: ios.red, bg: ios.red + '15',
      icono: '❌', titulo: 'QR INVÁLIDO',
      subtitulo: () => 'No corresponde a este evento',
    },
    pago_pendiente: {
      color: ios.orange, bg: ios.orange + '15',
      icono: '💳', titulo: 'PAGO PENDIENTE',
      subtitulo: (r: ResultadoScan) => `${r.nombre ?? ''}\nEl pago no fue confirmado`,
    },
    error: {
      color: ios.red, bg: ios.red + '15',
      icono: '⚠️', titulo: 'ERROR',
      subtitulo: () => 'Intentá de nuevo',
    },
  }

  // Pantalla PIN
  if (!autenticado) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'white', fontFamily: ios.font }}>Scanner</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontFamily: ios.font, marginTop: 6 }}>Ingresá el PIN del evento</div>
          </div>

          <input
            type="number"
            value={pinIngresado}
            onChange={e => setPinIngresado(e.target.value)}
            placeholder="PIN de 4 dígitos"
            maxLength={4}
            style={{
              width: '100%', boxSizing: 'border-box', background: '#1C1C1E',
              border: `1.5px solid ${pinError ? ios.red : '#3A3A3C'}`,
              borderRadius: 14, padding: '16px', fontSize: 28, fontWeight: 700,
              color: 'white', textAlign: 'center', fontFamily: 'monospace',
              outline: 'none', letterSpacing: '0.3em', marginBottom: 8,
            }}
            onKeyDown={e => e.key === 'Enter' && verificarPin()}
          />

          {pinError && (
            <div style={{ fontSize: 14, color: ios.red, textAlign: 'center', marginBottom: 12, fontFamily: ios.font }}>
              PIN incorrecto
            </div>
          )}

          <button
            onClick={verificarPin}
            disabled={pinIngresado.length < 4}
            style={{
              width: '100%', background: pinIngresado.length >= 4 ? ios.blue : '#3A3A3C',
              color: 'white', border: 'none', borderRadius: 14, padding: 16,
              fontSize: 17, fontWeight: 600, fontFamily: ios.font, cursor: pinIngresado.length >= 4 ? 'pointer' : 'default',
            }}
          >
            Ingresar
          </button>
        </div>
      </div>
    )
  }

  // Pantalla resultado
  if (resultado.estado) {
    const cfg = resultadoConfig[resultado.estado]
    const lineas = cfg.subtitulo(resultado).split('\n')
    return (
      <div style={{ minHeight: '100vh', background: cfg.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>{cfg.icono}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: cfg.color, fontFamily: ios.font, marginBottom: 12, textAlign: 'center' }}>{cfg.titulo}</div>
        {lineas.map((l, i) => (
          <div key={i} style={{ fontSize: i === 0 ? 22 : 16, fontWeight: i === 0 ? 600 : 400, color: cfg.color, fontFamily: ios.font, textAlign: 'center', opacity: i === 0 ? 1 : 0.7, marginBottom: 4 }}>{l}</div>
        ))}
        <button
          onClick={siguienteScan}
          style={{ marginTop: 40, background: cfg.color, color: 'white', border: 'none', borderRadius: 16, padding: '16px 40px', fontSize: 18, fontWeight: 600, fontFamily: ios.font, cursor: 'pointer' }}
        >
          Siguiente
        </button>
      </div>
    )
  }

  // Pantalla scanner
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '50px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'white', fontFamily: ios.font }}>Scanner QR</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: ios.font }}>PIN: {pinIngresado}</div>
      </div>

      <div id="qr-reader" ref={divRef} style={{ flex: 1, background: '#000' }} />

      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontFamily: ios.font }}>
          Apuntá la cámara al QR del ticket
        </div>
      </div>
    </div>
  )
}
