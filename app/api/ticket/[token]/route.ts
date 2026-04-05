import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createServiceClient()

  const { data: ticket, error } = await supabase
    .from('asistentes')
    .select(`
      *,
      evento:eventos(*),
      evento_profesor:evento_profesores(*, profesor:profesores(*))
    `)
    .eq('qr_token', params.token)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ticket })
}
