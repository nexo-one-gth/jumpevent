'use client'

import { ReactNode } from 'react'

// ── Tokens iOS ────────────────────────────────────────────────
export const ios = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  pink: '#FF2D55',
  label: '#000000',
  label2: 'rgba(60,60,67,0.85)',
  label3: 'rgba(60,60,67,0.6)',
  label4: 'rgba(60,60,67,0.18)',
  sep: 'rgba(60,60,67,0.12)',
  fill: 'rgba(120,120,128,0.12)',
  fill2: 'rgba(120,120,128,0.08)',
  font: "-apple-system,'SF Pro Display','SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif",
}

// ── NavBar ────────────────────────────────────────────────────
interface NavBarProps {
  titulo: string
  grande?: boolean
  accionLabel?: string
  onAccion?: () => void
  volver?: () => void
}
export function NavBar({ titulo, grande = true, accionLabel, onAccion, volver }: NavBarProps) {
  return (
    <div style={{ background: ios.card, borderBottom: `0.5px solid ${ios.sep}`, paddingBottom: grande ? 8 : 0, position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 16px' }}>
        {volver
          ? <button onClick={volver} style={{ background: 'none', border: 'none', fontSize: 17, color: ios.blue, cursor: 'pointer', fontFamily: ios.font, padding: 0 }}>← Volver</button>
          : <div style={{ width: 60 }} />
        }
        {!grande && <span style={{ fontSize: 17, fontWeight: 600, color: ios.label, fontFamily: ios.font }}>{titulo}</span>}
        <div style={{ width: 60, textAlign: 'right' }}>
          {accionLabel && (
            <button onClick={onAccion} style={{ background: 'none', border: 'none', fontSize: 17, color: ios.blue, cursor: 'pointer', fontFamily: ios.font, padding: 0 }}>
              {accionLabel}
            </button>
          )}
        </div>
      </div>
      {grande && (
        <div style={{ padding: '0 16px 6px', fontSize: 34, fontWeight: 700, color: ios.label, fontFamily: ios.font, letterSpacing: '-0.5px' }}>
          {titulo}
        </div>
      )}
    </div>
  )
}

// ── Cell (fila de lista estilo Settings) ─────────────────────
interface CellProps {
  label: string
  value?: string
  detail?: string
  chevron?: boolean
  color?: string
  onPress?: () => void
  top?: boolean
  bottom?: boolean
  badge?: { label: string; color: string; bg: string }
  leftIcon?: ReactNode
  destructivo?: boolean
}
export function Cell({ label, value, detail, chevron, color, onPress, top, bottom, badge, leftIcon, destructivo }: CellProps) {
  const radius = `${top ? '12px 12px' : '0 0'} ${bottom ? '12px 12px' : '0 0'}`
  return (
    <div
      onClick={onPress}
      style={{
        background: ios.card,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        minHeight: 44,
        borderRadius: radius,
        cursor: onPress ? 'pointer' : 'default',
        userSelect: 'none',
        gap: 10,
      }}
    >
      {leftIcon && <div style={{ flexShrink: 0 }}>{leftIcon}</div>}
      <span style={{ flex: 1, fontSize: 17, color: destructivo ? ios.red : color || ios.label, fontFamily: ios.font }}>
        {label}
      </span>
      {badge && (
        <span style={{ background: badge.bg, color: badge.color, fontSize: 12, fontWeight: 600, borderRadius: 999, padding: '2px 8px' }}>
          {badge.label}
        </span>
      )}
      {value && <span style={{ fontSize: 17, color: ios.label3, fontFamily: ios.font, marginRight: chevron ? 4 : 0 }}>{value}</span>}
      {detail && <span style={{ fontSize: 14, color: ios.label3, fontFamily: ios.font, textAlign: 'right', maxWidth: 180, marginRight: chevron ? 4 : 0 }}>{detail}</span>}
      {chevron && (
        <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
          <path d="M1 1L8 7.5L1 14" stroke={ios.label4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

// ── Group (contenedor de celdas) ──────────────────────────────
interface GroupProps {
  children: ReactNode | ReactNode[]
  label?: string
  footer?: string
}
export function Group({ children, label, footer }: GroupProps) {
  const kids = (Array.isArray(children) ? children : [children]).filter(Boolean)
  return (
    <div style={{ marginBottom: 0 }}>
      {label && (
        <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 16px 6px', fontWeight: 400 }}>
          {label}
        </div>
      )}
      <div style={{ borderRadius: 12, overflow: 'hidden', background: ios.card }}>
        {kids.map((child, i) => (
          <div key={i}>
            {/* @ts-ignore */}
            {i > 0 && <div style={{ height: '0.5px', background: ios.sep, marginLeft: 16 }} />}
            {child}
          </div>
        ))}
      </div>
      {footer && (
        <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, padding: '6px 16px 0', lineHeight: 1.4 }}>
          {footer}
        </div>
      )}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ valor, label, color, icono }: { valor: number | string; label: string; color: string; icono: string }) {
  return (
    <div style={{ flex: 1, background: ios.card, borderRadius: 16, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 22 }}>{icono}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: ios.font, letterSpacing: '-0.5px', lineHeight: 1 }}>{valor}</div>
      <div style={{ fontSize: 12, color: ios.label3, fontFamily: ios.font, lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

// ── Pill / Badge ──────────────────────────────────────────────
export function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color, background: bg, borderRadius: 999, padding: '2px 8px', fontFamily: ios.font, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

// ── Avatar ────────────────────────────────────────────────────
export function Avatar({ nombre, color, size = 36 }: { nombre: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color + '22', border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color, flexShrink: 0, fontFamily: ios.font }}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Switch iOS ────────────────────────────────────────────────
export function IOSSwitch({ activo, onToggle }: { activo: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{ width: 51, height: 31, borderRadius: 999, background: activo ? ios.green : '#E5E5EA', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0 }}
    >
      <div style={{ position: 'absolute', top: 2, left: activo ? 22 : 2, width: 27, height: 27, borderRadius: '50%', background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.25)', transition: 'left 0.22s' }} />
    </div>
  )
}

// ── SegmentedControl ──────────────────────────────────────────
export function SegmentedControl({ opciones, activo, onChange }: { opciones: { id: string; label: string }[]; activo: string; onChange: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', background: ios.fill, borderRadius: 8, padding: 2 }}>
      {opciones.map(op => (
        <button
          key={op.id}
          onClick={() => onChange(op.id)}
          style={{
            flex: 1, padding: '5px 0', borderRadius: 6, border: 'none',
            fontSize: 13, fontWeight: activo === op.id ? 600 : 400,
            background: activo === op.id ? 'white' : 'transparent',
            color: activo === op.id ? ios.label : ios.label3,
            fontFamily: ios.font, cursor: 'pointer',
            boxShadow: activo === op.id ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all 0.18s',
          }}
        >
          {op.label}
        </button>
      ))}
    </div>
  )
}

// ── BottomSheet ───────────────────────────────────────────────
export function BottomSheet({ abierto, onCerrar, titulo, children }: { abierto: boolean; onCerrar: () => void; titulo: string; children: ReactNode }) {
  if (!abierto) return null
  return (
    <>
      <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: ios.card, borderRadius: '20px 20px 0 0', zIndex: 101, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: ios.label4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 16px' }}>
          <span style={{ fontFamily: ios.font, fontSize: 20, fontWeight: 700, color: ios.label }}>{titulo}</span>
          <button onClick={onCerrar} style={{ background: ios.fill, border: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: ios.label3 }}>✕</button>
        </div>
        <div style={{ padding: '0 16px 40px' }}>{children}</div>
      </div>
    </>
  )
}

// ── InputField ────────────────────────────────────────────────
export function InputField({ label, value, onChange, placeholder, type = 'text', requerido, error }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; requerido?: boolean; error?: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: ios.label3, fontFamily: ios.font, marginBottom: 5 }}>
        {label} {requerido && <span style={{ color: ios.pink }}>*</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: ios.fill2, border: `1.5px solid ${error ? ios.red : 'transparent'}`,
          borderRadius: 10, padding: '11px 14px',
          fontSize: 16, color: ios.label, fontFamily: ios.font, outline: 'none',
        }}
      />
      {error && <div style={{ fontSize: 12, color: ios.red, marginTop: 3 }}>{error}</div>}
    </div>
  )
}

// ── Botón primario ────────────────────────────────────────────
export function BtnPrimario({ label, onClick, disabled, fullWidth = true }: { label: string; onClick: () => void; disabled?: boolean; fullWidth?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        background: disabled ? '#C7C7CC' : ios.blue,
        color: 'white', border: 'none', borderRadius: 14,
        padding: '14px 20px', fontSize: 17, fontWeight: 600,
        fontFamily: ios.font, cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {label}
    </button>
  )
}
