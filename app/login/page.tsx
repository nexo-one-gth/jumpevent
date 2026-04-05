'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ios } from '@/components/ui/ios'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') || '/dashboard'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setCargando(true)

        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError('Email o contraseña incorrectos')
            setCargando(false)
            return
        }

        router.push(redirect)
        router.refresh()
    }

    return (
        <form onSubmit={handleLogin}>
            <div style={{
                background: ios.card,
                borderRadius: 16,
                overflow: 'hidden',
                border: `0.5px solid ${ios.sep}`,
            }}>
                {/* Email */}
                <div style={{ padding: '0 16px' }}>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        autoComplete="email"
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            border: 'none', background: 'transparent',
                            padding: '14px 0', fontSize: 17,
                            color: ios.label, fontFamily: ios.font,
                            outline: 'none',
                        }}
                    />
                </div>

                <div style={{ height: '0.5px', background: ios.sep, marginLeft: 16 }} />

                {/* Password */}
                <div style={{ padding: '0 16px' }}>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        required
                        autoComplete="current-password"
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            border: 'none', background: 'transparent',
                            padding: '14px 0', fontSize: 17,
                            color: ios.label, fontFamily: ios.font,
                            outline: 'none',
                        }}
                    />
                </div>
            </div>

            {error && (
                <div style={{
                    fontSize: 14, color: ios.red, textAlign: 'center',
                    marginTop: 12,
                }}>
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={cargando}
                style={{
                    width: '100%',
                    marginTop: 20,
                    background: cargando ? '#C7C7CC' : ios.blue,
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: 15,
                    fontSize: 17,
                    fontWeight: 600,
                    fontFamily: ios.font,
                    cursor: cargando ? 'default' : 'pointer',
                }}
            >
                {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
        </form>
    )
}

export default function LoginPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: ios.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            fontFamily: ios.font,
        }}>
            <div style={{
                width: '100%',
                maxWidth: 380,
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 68, height: 68, borderRadius: 16,
                        background: 'linear-gradient(135deg, #5856D6, #FF2D55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, margin: '0 auto 14px',
                    }}>
                        🎤
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: ios.label, letterSpacing: '-0.5px' }}>
                        Jumping Events
                    </div>
                    <div style={{ fontSize: 15, color: ios.label3, marginTop: 4 }}>
                        Panel de administración
                    </div>
                </div>

                <Suspense fallback={
                    <div style={{ textAlign: 'center', color: ios.label3, fontSize: 15 }}>
                        Cargando…
                    </div>
                }>
                    <LoginForm />
                </Suspense>

                <div style={{
                    fontSize: 12, color: ios.label3, textAlign: 'center',
                    marginTop: 20, lineHeight: 1.5,
                }}>
                    Acceso exclusivo para la organizadora.<br />
                    Si no tenés cuenta, pedile al admin que te cree una.
                </div>
            </div>
        </div>
    )
}
