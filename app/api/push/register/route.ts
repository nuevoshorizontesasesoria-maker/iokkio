import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { reservation_id, role, guest_id, token } = await request.json();

    if (!reservation_id || !role || !token) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    if (role !== 'organizer' && role !== 'guest') {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          reservation_id,
          role,
          guest_id: role === 'guest' ? guest_id : null,
          token,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'reservation_id,role,guest_id' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error guardando token push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}