import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminModule = await import('firebase-admin');
    const admin: any = adminModule.default || adminModule;

    if (!admin.apps || !admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FCM_SERVICE_ACCOUNT || '{}')
        ),
      });
    }

    const { reservation_id, confirmed } = await request.json();

    if (!reservation_id) {
      return NextResponse.json({ error: 'Falta reservation_id' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        organizer_confirmed: confirmed !== false,
        comandas_open: confirmed !== false,
        status: confirmed !== false ? 'confirmed' : 'cancelled',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', reservation_id);

    if (updateError) throw updateError;

    if (confirmed !== false) {
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token, guest_id')
        .eq('reservation_id', reservation_id)
        .eq('role', 'guest');

      if (tokens && tokens.length > 0) {
        const mensajes = tokens.map((t) =>
          admin
            .messaging()
            .send({
              token: t.token,
              notification: {
                title: '¡Ya podés elegir tu menú! 🍽️',
                body: 'El anfitrión confirmó la reserva. Elegí tus platos ahora.',
              },
              data: {
                reservation_id,
                url: `https://app.iokkio.com/menu-grupo?id=${reservation_id}`,
                type: 'comandas_open',
              },
            })
            .catch((err: any) => console.error(`Error con token ${t.token}:`, err))
        );

        await Promise.all(mensajes);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error confirmando:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}