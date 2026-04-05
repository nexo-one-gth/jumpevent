import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refrescar sesión (necesario para mantener el token activo)
    const { data: { user } } = await supabase.auth.getUser()

    // Rutas admin protegidas
    const esRutaAdmin = request.nextUrl.pathname.startsWith('/dashboard')
        || request.nextUrl.pathname.startsWith('/profes')
        || request.nextUrl.pathname.startsWith('/alumnos')
        || request.nextUrl.pathname.startsWith('/evento')
        || request.nextUrl.pathname.startsWith('/scanner')

    // Si no tiene sesión y quiere ir a una ruta admin → login
    if (esRutaAdmin && !user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Si ya tiene sesión y está en login → dashboard
    if (request.nextUrl.pathname === '/login' && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/profes/:path*',
        '/alumnos/:path*',
        '/evento/:path*',
        '/scanner/:path*',
        '/login',
    ],
}
