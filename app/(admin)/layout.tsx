'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ios } from '@/components/ui/ios'

const TABS = [
  {
    id: 'dashboard',
    label: 'Resumen',
    path: '/dashboard',
    icono: (activo: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          fill={activo ? ios.blue : 'none'}
          stroke={activo ? ios.blue : ios.label3}
          strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'profes',
    label: 'Profes',
    path: '/profes',
    icono: (activo: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" fill={activo ? ios.blue : 'none'} stroke={activo ? ios.blue : ios.label3} strokeWidth="1.8" />
        <path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke={activo ? ios.blue : ios.label3} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M16 11c1.657 0 3 1.343 3 3M21 20c0-2.761-2.239-5-5-5" stroke={activo ? ios.blue : ios.label3} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    id: 'alumnos',
    label: 'Alumnos',
    path: '/alumnos',
    icono: (activo: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <line x1="8" y1="6" x2="20" y2="6" stroke={activo ? ios.blue : ios.label3} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="8" y1="12" x2="20" y2="12" stroke={activo ? ios.blue : ios.label3} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="8" y1="18" x2="20" y2="18" stroke={activo ? ios.blue : ios.label3} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="4" cy="6" r="1.2" fill={activo ? ios.blue : ios.label3} />
        <circle cx="4" cy="12" r="1.2" fill={activo ? ios.blue : ios.label3} />
        <circle cx="4" cy="18" r="1.2" fill={activo ? ios.blue : ios.label3} />
      </svg>
    ),
  },
  {
    id: 'evento',
    label: 'Evento',
    path: '/evento',
    icono: (activo: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" fill={activo ? ios.blue : 'none'} stroke={activo ? ios.blue : ios.label3} strokeWidth="1.8" />
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke={activo ? ios.blue : ios.label3} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: ios.bg, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* Contenido principal */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {children}
      </div>

      {/* Tab Bar inferior */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'rgba(255,255,255,0.92)',
        borderTop: `0.5px solid ${ios.sep}`,
        padding: '6px 0 20px',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        zIndex: 50,
      }}>
        {TABS.map(tab => {
          const activo = pathname === tab.path || pathname.startsWith(tab.path + '/')
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.path)}
              style={{
                flex: 1, background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3, padding: '4px 0',
              }}
            >
              {tab.icono(activo)}
              <span style={{
                fontSize: 10, fontFamily: ios.font,
                color: activo ? ios.blue : ios.label3,
                fontWeight: activo ? 500 : 400,
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
