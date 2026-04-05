import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jumping Events',
  description: 'Sistema de gestión de eventos Jumping Master Class',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: '#F2F2F7', fontFamily: "-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
