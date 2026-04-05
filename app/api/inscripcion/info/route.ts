import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Slug requerido' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: ep, error } = await supabase
    .from('evento_profesores')
    .select('*, profesor:profesores(*), evento:eventos(*)')
    .eq('slug', slug)
    .single()

  if (error || !ep || !ep.evento?.activo) {
    return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  }

  return NextResponse.json({ ep })
}
